const express = require('express');
const models = require('./models');
const {symbols, requireKeys, success} = require('origami-core-lib');
const bodyParser = require('body-parser');
const listEndPoints = require('express-list-endpoints');


const Options = require('./Options');

// Private symbols
const s = symbols([
    // Props
    'app',
    'options',
    'store',
    'admin',
    'positions',
    'queues',
    // Methods
    'setup',
    'setupMiddleware'
]);
const DEFAULT_PORT = 8080;


module.exports = class Server {
    constructor(options, store, admin) {
        const app = this[s.app] = express();
        this[s.store] = store;
        this[s.admin] = admin;


        // Assign these to a singleton class so they can be use across the server
        Options.options = this[s.options] = {
            ...{
                port: process.env.NODE_ENV || DEFAULT_PORT,
                ln: 'enUS'
            }, ...options
        };


        // Different positions to run route at
        this[s.positions] = [
            'pre-store',
            'post-store',
            'pre-render',
            'post-render',
            'pre-send'
        ];
        this[s.queues] = {};
        this[s.positions].forEach(p => this[s.queues][p] = []);


        // Validate the options
        try {
            requireKeys(['secret'], this[s.options]);
        } catch (e) {
            throw new Error(`Origami.Server: Missing '${e.key}' setting`);
        }

        this[s.setup]();


        app.set('ln', this[s.options].ln);
    }


    // Registers all the middleware and serves the app
    async [s.setup]() {
        // Setup the store
        models(this[s.store]);
        this[s.app].set('store', this[s.store]);

        // Setup the middleware
        await this[s.setupMiddleware]();

        // Serve the app
        this.serve();
    }


    // Runs the app
    serve() {
        this[s.app].listen(this[s.options].port);
        success('Server', 'Listening on port', this[s.options].port.cyan);
    }


    // Add the Router's routes in each position to the middleware queue
    useRouter(router) {
        this[s.positions].forEach(p => {
            this[s.queues][p].push(router.routers[p]);
        });
        router.nested.forEach(this.useRouter.bind(this));
    }


    // Lists all the endpoints and their methods
    list() {
        listEndPoints(this[s.app]).forEach(({methods: [m], path: p}) => {
            const _m = `     ${m}`.slice(-1 * 'DELETE'.length);
            console.log(' '.repeat(2), _m.toUpperCase().grey, p.magenta);
        });
    }


    async [s.setupMiddleware]() {
        this[s.app].use(bodyParser.urlencoded({
            extended: true
        }));
        this[s.app].use(bodyParser.json());


        // Loop over positions, and run middleware queue stored in each
        this[s.app].use(await require('./middleware/positions')(
            this[s.positions],
            this[s.queues]
        ));

        // Setup admin
        this[s.app].use('/admin/', this[s.admin]());

        // Setup API
        this.useRouter(
            await require('./controllers/api')()
        );

        // Setup theme
        let initialTheme = null;
        const [setting] = await this[s.store].model('setting').find({setting: 'theme'});
        if (setting) initialTheme = setting.value;
        const theme = await require('./controllers/theme')('snow');
        console.log(initialTheme, theme);

        this[s.app].use(theme);


        this[s.app].use(await require('./middleware/errors')());
        this[s.app].use(await require('./middleware/format')());
    }
};

const express = require('express');
const models = require('./models');
const {symbols, requireKeys, success, error} = require('origami-core-lib');
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
    'positionRouters',
    // Methods
    'setup',
    'generatePositions',
    'setupMiddleware',
    'position'
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
            'init',

            'pre-store',
            'store',
            'post-store',

            'pre-render',
            'render',
            'post-render',

            'pre-send'
        ];
        this[s.positionRouters] = {};
        this[s.positions].forEach(p => this[s.positionRouters][p] = new express.Router());


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

        // Generate the position routers...
        await this[s.generatePositions]();

        // Setup the middleware
        await this[s.setupMiddleware]();

        // Serve the app
        this.serve();
    }


    // Runs the app
    serve() {
        this[s.app].listen(this[s.options].port);
        success('Server', 'Listening on port', this[s.options].port.toString().cyan);
    }


    // Add the Router's routes in each position to the middleware
    useRouter(router) {
        this[s.positions].forEach(p => {
            const pr = this[s.positionRouters][p];
            router.routers[p].forEach(({path, handlers, method}) => {
                try {
                    pr[method](path, handlers);
                    success('Server', `Conected ${p} route: `, method.toUpperCase().blue, path.blue);
                } catch (e) {
                    error('Server', new Error(`Could not connect ${method.toUpperCase().yellow} ${path.yellow}`));
                }
            });
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


    async [s.generatePositions]() {
        // Setup API
        this.useRouter(
            await require('./controllers/api')()
        );

        // Load initial theme
        let initialTheme = null;
        const [setting] = await this[s.store].model('setting').find({setting: 'theme'});
        if (setting) initialTheme = setting.value;

        // Setup Theme
        this.useRouter(await require('./controllers/theme')(initialTheme));
    }

    async [s.setupMiddleware]() {

        this[s.position]('init');


        this[s.app].use(bodyParser.urlencoded({
            extended: true
        }));
        this[s.app].use(bodyParser.json());


        // Setup admin
        this[s.app].use('/admin/', this[s.admin]());


        // Validate the API against the RAML
        this[s.app].use('/api/v1', await require('./middleware/raml')());


        // PRE-STORE position
        this[s.position]('pre-store');
        this[s.position]('store');
        this[s.position]('post-store');


        // PRE-RENDER position
        this[s.position]('pre-render');
        this[s.position]('render');
        this[s.position]('post-render');


        // Wrap for friendly errors
        this[s.app].use(await require('./middleware/errors')());


        // PRE-SEND position
        this[s.position]('pre-send');
        this[s.app].use(await require('./middleware/format')());
    }

    // Run the middleware for the router position
    [s.position](pos) {
        this[s.app].use((req, res, next) => {
            console.log(req.method.yellow, req.url.yellow, pos.grey);
            next();
        }, this[s.positionRouters][pos]);
    }
};

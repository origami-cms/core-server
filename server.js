const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
require('colors');
const {symbols, requireKeys} = require('origami-core-lib');
const Options = require('./Options');

// Private symbols
const s = symbols([
    // Props
    'app',
    'options',
    'store',
    'admin',
    // Methods
    'setup',
    'setupStore',
    'setupMiddleware'
]);


const DEFAULT_PORT = 8080;


module.exports = class Server {
    constructor(options, store, admin) {
        const app = this[s.app] = express();
        this[s.store] = store;
        this[s.admin] = admin;


        // Assign these to a singleton class so they can be use across the server
        Options.options = this[s.options] = {...{
            port: process.env.NODE_ENV || DEFAULT_PORT,
            ln: 'enUS'
        }, ...options};


        // Validate the options
        try {
            requireKeys(['secret'], this[s.options]);
        } catch (e) {
            throw new Error(`Origami.Server: Missing '${e.key}' setting`);
        }

        this[s.setup]();


        app.set('ln', this[s.options].ln);
    }


    serve() {
        this[s.app].listen(this[s.options].port);
        console.log('Origami.Server: Listening on port %d', this[s.options].port);
    }


    async [s.setup]() {
        await this[s.setupStore]();
        await this[s.setupMiddleware]();
        this.serve();
    }


    [s.setupStore]() {
        const store = this[s.store];
        fs
            .readdirSync(path.resolve(__dirname, './models'))
            .filter(f => (/.*\.js$/).test(f))
            .forEach(f => store.model(
                f.split('.')[0],
                require(`./models/${f}`)
            ));

        this[s.app].set('store', store);
    }


    async [s.setupMiddleware]() {
        this[s.app].use(bodyParser());

        // Setup admin UI
        this[s.app].use('/admin/', this[s.admin]());

        // Setup API
        this[s.app].use('/api/v1',
            await require('./middleware/raml')(),
            await require('./controllers/api')(),
        );
        // Setup theme
        this[s.app].use(
            await require('./controllers/theme')()
        );
        this[s.app].use(await require('./middleware/errors')());
        this[s.app].use(await require('./middleware/format')());
    }
};

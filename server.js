const express = require('express');
require('colors');
const {symbols, requireKeys} = require('./lib');

// Private symbols
const s = symbols(['app', 'options', 'setupMiddleware']);


const DEFAULT_PORT = 8080;


module.exports = class Server {
    constructor(options) {
        const app = this[s.app] = express();


        this[s.options] = {...{
            port: process.env.NODE_ENV || DEFAULT_PORT,
            ln: 'enUS'
        }, ...options};


        // Validate the options
        try {
            requireKeys(['secret'], this[s.options]);
        } catch (e) {
            throw new Error(`Origami.Server: Missing '${e.key}' setting`);
        }


        app.set('ln', this[s.options].ln);

        this.serve();
    }


    serve() {
        this[s.setupMiddleware]();
        this[s.app].listen(this[s.options].port);
        console.log('Origami server listening on port %d', this[s.options].port);
    }


    async [s.setupMiddleware]() {
        this[s.app].use('/api/v1',
            await require('./middleware/raml')()
        );
        this[s.app].use('/api/v1',
            await require('./controllers')()
        );
        this[s.app].use(await require('./middleware/errors')());
        this[s.app].use(await require('./middleware/format')());
    }
};

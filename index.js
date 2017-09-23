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


        this[s.app].use(require('./middleware/format'));
        this[s.app].use(require('./middleware/auth'));
        app.use('/', (req, res) => res.send('ok'));

        this.serve();
    }


    serve() {
        this[s.setupMiddleware]();
        this[s.app].listen(this[s.options].port);
        console.log('Origami server listening on port %d', this[s.options].port);
    }


    [s.setupMiddleware]() {
        this[s.app].use(require('./middleware/errors'));
    }
};

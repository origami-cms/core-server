const express = require('express');
const path = require('path');
const {symbols} = require('../lib');

const s = symbols(['raml', 'namespace', 'buildRoutes']);

module.exports = class Controller {
    constructor(ramlObj, namespace = '') {
        this[s.raml] = ramlObj;
        this[s.namespace] = namespace;

        this.router = new express.Router();

        this[s.buildRoutes]();

        if (ramlObj.resources) {
            ramlObj.resources.forEach(r => {
                const c = new Controller(r, this.url);
                this.router.use(c.router);
            });
        }
    }

    /**
     * URL of the controller
     * @return {String} Build from RAML
     */
    get url() {
        return this[s.namespace] + this[s.raml].relativeUri;
    }


    /**
     * Builds the routes specified in the RAML, using this class as default
     * method handler, and overriding with filsystem controller
     * @type {Function}
     */
    async [s.buildRoutes]() {
        const methods = {};
        let overrideMethods = {};

        // Use default methods from this controller class
        this[s.raml].methods.reduce((_methods, m) => {
            methods[m.method] = this[m.method].bind(this);
        }, methods);


        // Override any methods from the file system
        try {
            overrideMethods = require(path.join(__dirname, this[s.raml].absoluteUri));
        } catch (e) {
            // No override methods present
        }

        // Run the overrides
        const run = Object.entries(overrideMethods).map(async([method, func]) => {
            methods[method] = await func(this);
        });
        await Promise.all(run);


        // Register the methods to the router
        Object.entries(methods).forEach(([m, func]) => {
            this.router[m](this.url, func);
        });
    }

    async get(req, res, next) {
        res.data = {a: 1};
        await next();
    }
};

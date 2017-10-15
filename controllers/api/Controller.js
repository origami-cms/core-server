const express = require('express');
const path = require('path');
const {symbols} = require('origami-core-lib');
const pluralize = require('pluralize');
const mwAuth = require('../../middleware/auth');
const mwFormat = require('../../middleware/formatRamlResponse');

const s = symbols([
    // Properties
    'raml',
    // Methods
    'buildRoutes',
    'getModel'
]);

module.exports = class Controller {
    constructor(ramlObj) {
        this[s.raml] = ramlObj;

        this.router = new express.Router();


        // Authenticate the route if it has `securedBy` property
        const [auth] = this[s.raml].securedBy || [];
        if (auth) {
            if (auth.schemeName === 'JWT') this.router.use(mwAuth);
        }


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
        if (!this[s.raml].parentUrl) return '/';
        else return this[s.raml].relativeUri;
    }

    /**
     * Singular name of the resource
     * @return {String} Build from RAML
     */
    get name() {
        return pluralize.singular(this[s.raml].displayName.slice(1));
    }

    /**
     * Singular name of the parent resource
     * @return {String} Build from RAML
     */
    get parentName() {
        return pluralize.singular(this[s.raml].parentUrl.slice(1));
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
        if (this[s.raml].methods) {
            this[s.raml].methods.reduce((_methods, m) => {
                methods[m.method] = this[m.method].bind(this);
            }, methods);
        }


        // Override any methods from the file system
        try {
            overrideMethods = require(path.join(__dirname, this[s.raml].absoluteUri));
        } catch (e) {
            // Console.log(e);
            // No override methods present
        }
        // Run the overrides
        const run = Object.entries(overrideMethods).map(async([method, func]) => {
            methods[method] = await func(this);
        });
        await Promise.all(run);

        // Register the methods to the router
        Object.entries(methods).forEach(([m, func]) => {
            const _m = `     ${m}`.slice(-1 * 'DELETE'.length);
            console.log(' '.repeat(2), _m.toUpperCase().grey, this[s.raml].absoluteUri.magenta);
            this.router[m](this.url, func, mwFormat(this[s.raml]));
        });
    }


    async [s.getModel](req, res) {
        const resourceId = req.params[`${this.parentName}Id`];
        const modelName = resourceId ? this.parentName : this.name;
        const model = await res.app.get('store').model(modelName);

        return {resourceId, model, modelName};
    }


    async get(req, res, next) {
        let model;
        let resourceId;
        let modelName;

        try {
            ({model, resourceId, modelName} = await this[s.getModel](req, res));
        } catch (e) {
            if (next) return next(e);
            else throw e;
        }

        const filter = resourceId ? {id: resourceId} : null;
        const data = await model.find(filter);

        // If getting a single resource, and there is none, 404
        if (!data && resourceId) return next(new Error(`${modelName}.errors.notFound`));

        res.data = data;
        res.responseCode = `${modelName}.success.${resourceId ? 'getOne' : 'getList'}`;
        if (next) await next();
    }


    async post(req, res, next) {
        try {
            const {model, modelName} = await this[s.getModel](req, res);
            res.data = await model.create(req.body);
            res.responseCode = `${modelName}.success.create`;
        } catch (e) {
            if (next) await next(e);
            else throw e;
        }
        if (next) await next();
    }


    async put(req, res, next) {
        try {
            // Const {model, resourceId, modelName} = await this[s.getModel](req, res);
        } catch (e) {
            if (next) return next(e);
            else throw e;
        }
        // Res.data = await model.update(resourceId, req.body);
        if (next) await next();
    }


    async delete(req, res, next) {
        if (next) await next();
    }
};

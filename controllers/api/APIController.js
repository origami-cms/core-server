const path = require('path');
const {symbols} = require('origami-core-lib');
const pluralize = require('pluralize');
const mwAuth = require('../../middleware/auth');
const routington = require('routington');

const s = symbols([
    // Properties
    'raml',
    // Methods
    'setupMethod',
    'getModel'
]);

module.exports = class APIController {
    constructor(raml, parent) {
        this[s.raml] = raml;
        this.parent = parent;

        this.route = parent.route.route(raml.relativeUri);

        // Authenticate the route if it has `securedBy` property
        const [auth] = this[s.raml].securedBy || [];
        if (auth) {
            if (auth.schemeName === 'JWT') this.route.use(mwAuth);
        }

        if (raml.methods) raml.methods.forEach(this[s.setupMethod].bind(this));

        if (raml.resources) raml.resources.forEach(r => new APIController(r, this));
    }

    /**
     * Singular name of the resource
     * @return {String} Built from RAML
     */
    get name() {
        return pluralize.singular(this[s.raml].displayName.slice(1));
    }

    /**
     * Get the ID of the request
     * @param {Request} req Request object
     * @return {String} Built from RAML
     */
    id(req) {
        if (!this.parent.name) return false;

        const r = routington();
        r.define(this[s.raml].absoluteUri);
        const {param} = r.match(req.url);

        return param[`${this.parent.name}Id`];
    }


    overrides() {
        let methods = {};
        const fp = path.join(__dirname, `${this[s.raml].absoluteUri}.js`);
        try {
            methods = require(fp);
        } catch (e) {
            // No file
        }

        return methods;
    }


    async get(req, res, next) {
        // If there is already data passed, skip
        if (res.data) return next();

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
            const {model, resourceId} = await this[s.getModel](req, res);
            res.data = await model.update(resourceId, req.body);
        } catch (e) {
            if (next) return next(e);
            else throw e;
        }
        if (next) await next();
    }


    async delete(req, res, next) {
        if (next) await next();
    }


    async [s.getModel](req, res) {
        const resourceId = await this.id(req);
        const modelName = resourceId ? this.parent.name : this.name;
        const model = await res.app.get('store').model(modelName);

        return {resourceId, model, modelName};
    }


    async [s.setupMethod]({method}) {
        // Look for an override in the file, otherwise do the default
        const override = await this.overrides()[method];
        this.route[method](
            override ? override(this) : this[method].bind(this)
        );
    }
};

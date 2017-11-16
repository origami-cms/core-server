const path = require('path');
const {symbols} = require('origami-core-lib');
const pluralize = require('pluralize');
const mwAuth = require('../../middleware/auth');
const routington = require('routington');
const url = require('url');
const _ = require('lodash');

const s = symbols([
    // Properties
    'raml',
    // Methods
    'setupMethod',
    'getModel',
    'mwAssignParams'
]);

module.exports = class APIController {
    constructor(raml, parent) {
        this[s.raml] = raml;
        this.parent = parent;

        // Create the route
        this.route = parent.route.route(raml.relativeUri);

        // Reassign the params back on the req
        this.route.use(this[s.mwAssignParams].bind(this));

        // Authenticate the route if it has `securedBy` property
        const [auth] = this[s.raml].securedBy || [];
        if (auth) {
            if (auth.schemeName === 'JWT') this.route.use(mwAuth);
        }

        // Setup methods on THIS resource
        if (raml.methods) raml.methods.forEach(this[s.setupMethod].bind(this));
        // Nest children resources
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

        return req.params[`${this.parent.name}Id`];
    }


    /**
     * Finds the file of this resource, and returns any methods to override
     * default methods
     * @returns {Object} Obejct of methods
     */
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
        console.log("PARMS", req.params);
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

    // TODO: Delete resource
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


    // HACK: Req.params is lost somehow, even with {mergeParams: true}
    [s.mwAssignParams](req, res, next) {
        const r = routington();
        r.define(this[s.raml].absoluteUri);
        const match = r.match(url.parse(req.url).pathname);

        if (match) {
            _.omitBy(match.param, _.isNil);
            _.omitBy(match.param, _.isLength(0));
            if (match.param) req.params = match.param;
        }
        next();
    }
};

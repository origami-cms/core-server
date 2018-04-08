"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const pluralize = require('pluralize');
const auth_1 = __importDefault(require("../../middleware/auth"));
const lodash_1 = __importDefault(require("lodash"));
class APIController {
    constructor(raml, parent) {
        this._raml = raml;
        this.parent = parent;
        // Create the route
        this.route = parent.route.route(raml.relativeUri).position('store');
        // Authenticate the route if it has `securedBy` property
        const [auth = ''] = this._raml.securedBy || [];
        if (auth) {
            if (auth.schemeName === 'JWT')
                this.route.all(auth_1.default);
        }
        // Setup methods on THIS resource
        if (raml.methods)
            raml.methods.forEach(m => this._setupMethod(m.method));
        // Nest children resources
        if (raml.resources)
            raml.resources.forEach(r => new APIController(r, this));
    }
    /**
     * Singular name of the resource
     * @return {String} Built from RAML
     */
    get name() {
        return pluralize.singular(this._raml.displayName.slice(1));
    }
    /**
     * Get the ID of the request
     * @param {Request} req Request object
     * @return {String} Built from RAML
     */
    id(req) {
        if (!this.parent.name)
            return false;
        return req.params[`${this.parent.name}Id`];
    }
    /**
     * Finds the file of this resource, and returns any methods to override
     * default methods
     * @returns {Object} Obejct of methods
     */
    overrides() {
        let methods = {};
        const fp = path_1.default.join(__dirname, `${this._raml.absoluteUri}.js`);
        try {
            methods = require(fp);
            // Convert keys to uppercase
            methods = lodash_1.default.mapKeys(methods, (v, k) => k.toUpperCase());
        }
        catch (e) {
            if (fp.includes('tree'))
                console.log(e);
            // No file
        }
        return methods;
    }
    async get(req, res, next) {
        // If there is already data passed, skip
        if (res.data)
            return next();
        let model;
        let resourceId;
        let modelName;
        try {
            ({ model, resourceId, modelName } = await this._getModel(req, res));
        }
        catch (e) {
            if (next)
                return next(e);
            throw e;
        }
        const filter = resourceId ? { id: resourceId } : null;
        const data = await model.find(filter);
        // If getting a single resource, and there is none, 404
        if (!data && resourceId)
            return next(new Error(`${modelName}.errors.notFound`));
        res.data = data;
        res.responseCode = `${modelName}.success.${resourceId ? 'getOne' : 'getList'}`;
        if (next)
            await next();
    }
    async post(req, res, next) {
        try {
            const { model, modelName } = await this._getModel(req, res);
            res.data = await model.create(req.body);
            res.responseCode = `${modelName}.success.create`;
        }
        catch (e) {
            if (next)
                await next(e);
            else
                throw e;
        }
        if (next)
            await next();
    }
    async put(req, res, next) {
        try {
            const { model, resourceId } = await this._getModel(req, res);
            res.data = await model.update(resourceId, req.body);
        }
        catch (e) {
            if (next)
                return next(e);
            throw e;
        }
        if (next)
            await next();
    }
    // TODO: Delete resource
    async delete(req, res, next) {
        try {
            const { model, resourceId } = await this._getModel(req, res);
            res.data = await model.delete(resourceId);
        }
        catch (e) {
            if (next)
                return next(e);
            throw e;
        }
        if (next)
            await next();
    }
    async _getModel(req, res) {
        const resourceId = await this.id(req);
        const modelName = resourceId ? this.parent.name : this.name;
        const model = await res.app.get('store').model(modelName);
        return { resourceId, model, modelName };
    }
    async _setupMethod(method) {
        const m = method.toUpperCase();
        // Look for an override in the file, otherwise do the default
        const override = await this.overrides()[m];
        this.route.position('store')[method](override ? override(this) : this[method].bind(this));
    }
}
exports.default = APIController;

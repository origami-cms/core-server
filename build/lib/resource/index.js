"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const Router_1 = require("../../Router");
const pluralize = require('pluralize');
const auth_1 = __importDefault(require("../../middleware/auth"));
class Resource {
    constructor(resource, store, options) {
        this.resource = resource;
        this.store = store;
        this.options = options;
        this.resourcePlural = pluralize(resource);
        this.resource = pluralize.singular(resource);
        this.router = new Router_1.Route(`/api/v1/${this.resourcePlural}`)
            .position('store');
        this.subRouter = this.router.route(`/:${this.resource}Id`)
            .position('store');
        ['get', 'post'].forEach(m => {
            const rMethod = this.router[m];
            let cMethod = this[m];
            if (options.controllers) {
                switch (m) {
                    case 'get':
                        cMethod = options.controllers['list'] || cMethod;
                        break;
                    case 'post':
                        console.log('custom crate');
                        cMethod = options.controllers['create'] || cMethod;
                }
            }
            rMethod.bind(this.router)(this._auth.bind(this), cMethod.bind(this));
        });
        ['get', 'delete', 'put'].forEach(m => {
            const rMethod = this.subRouter[m];
            let cMethod = this[m];
            if (options.controllers) {
                switch (m) {
                    case 'get':
                        cMethod = options.controllers['get'] || cMethod;
                        break;
                    case 'put':
                        cMethod = options.controllers['update'] || cMethod;
                    case 'delete':
                        cMethod = options.controllers['delete'] || cMethod;
                }
            }
            rMethod.bind(this.subRouter)(this._auth.bind(this), cMethod.bind(this));
        });
        this.store.model(resource, options.model);
    }
    /**
     * Get the ID of the request
     * @param {Request} req Request object
     * @return {String}
     */
    id(req) {
        return req.params[`${this.resource}Id`];
    }
    async get(req, res, next) {
        // If there is already data passed, skip
        if (res.data)
            return next();
        let model;
        let resourceId;
        try {
            ({ model, resourceId } = await this._getModel(req, res));
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
            return next(new Error('resource.errors.notFound'));
        res.data = data;
        res.responseCode = `resource.success.${resourceId ? 'foundOne' : 'foundList'}`;
        if (next)
            await next();
    }
    async post(req, res, next) {
        try {
            const { model } = await this._getModel(req, res);
            res.data = await model.create(req.body);
            res.responseCode = 'resource.success.created';
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
            res.responseCode = 'resource.success.updated';
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
            await model.delete(resourceId);
            res.responseCode = 'resource.success.deleted';
            delete res.data;
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
        const model = await res.app.get('store').model(this.resource);
        return { resourceId, model };
    }
    _auth(req, res, next) {
        let useAuth = null;
        const m = req.method.toLowerCase();
        if (this.options.auth) {
            if (this.options.auth === true) {
                useAuth = true;
            }
            else {
                let set = this.options.auth[m];
                if (!this.id(req) && m === 'get')
                    set = this.options.auth['list'];
                if (set || set === false)
                    useAuth = set;
            }
        }
        if (useAuth === null || useAuth)
            return auth_1.default(req, res, next);
        next();
    }
}
exports.default = Resource;

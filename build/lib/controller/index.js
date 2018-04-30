"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const Router_1 = require("../../Router");
const pluralize = require('pluralize');
const auth_1 = __importDefault(require("../../middleware/auth"));
class Controller {
    constructor(resource, store, options) {
        this.resource = resource;
        this.store = store;
        this.options = options;
        this.resourcePlural = pluralize(resource);
        this.router = new Router_1.Route(`/api/v1/${this.resourcePlural}`);
        this.store.model(resource, options.model);
        ['get', 'post', 'delete', 'put'].forEach(m => {
            const rMethod = this.router[m];
            const cMethod = this[m];
            let useAuth = false;
            if (this.options.auth) {
                if (this.options.auth === true)
                    useAuth = true;
                else if (this.options.auth[m])
                    useAuth = true;
            }
            rMethod.bind(this.router)(useAuth ? auth_1.default : null, cMethod.bind(this));
        });
    }
    /**
     * Get the ID of the request
     * @param {Request} req Request object
     * @return {String} Built from RAML
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
            return next(new Error(`${this.resourcePlural}.errors.notFound`));
        res.data = data;
        res.responseCode = `${this.resourcePlural}.success.${resourceId ? 'getOne' : 'getList'}`;
        if (next)
            await next();
    }
    async post(req, res, next) {
        try {
            const { model } = await this._getModel(req, res);
            res.data = await model.create(req.body);
            res.responseCode = `${this.resourcePlural}.success.create`;
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
        const model = await res.app.get('store').model(this.resource);
        return { resourceId, model };
    }
}
exports.default = Controller;

import {Route} from '../../Router';

import path from 'path';
const pluralize = require('pluralize');
import mwAuth from '../../middleware/auth';
import {RAMLResource} from '../../types/RAML';
import {Origami} from 'origami-core-lib';
import _ from 'lodash';

type MethodOverrideHandlers = {
    [method in Origami.Server.Method]?: (ctrl: APIController) => {}
};


export default class APIController {
    parent: APIController;
    route: Route;

    private _raml: RAMLResource;

    constructor(raml: RAMLResource, parent: APIController) {
        this._raml = raml;
        this.parent = parent;

        // Create the route
        this.route = parent.route.route(raml.relativeUri).position('store');

        // Authenticate the route if it has `securedBy` property
        const [auth = ''] = this._raml.securedBy || [];
        if (auth) {
            if (auth.schemeName === 'JWT') this.route.all(mwAuth);
        }

        // Setup methods on THIS resource
        if (raml.methods) raml.methods.forEach(m => this._setupMethod(m.method));
        // Nest children resources
        if (raml.resources) raml.resources.forEach(r => new APIController(r, this));
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
    id(req: Origami.Server.Request) {
        if (!this.parent.name) return false;

        return req.params[`${this.parent.name}Id`];
    }


    /**
     * Finds the file of this resource, and returns any methods to override
     * default methods
     * @returns {Object} Obejct of methods
     */
    overrides() {
        let methods: MethodOverrideHandlers = {};
        const fp = path.join(__dirname, `${this._raml.absoluteUri}.js`);

        try {
            methods = require(fp);
            // Convert keys to uppercase
            methods = _.mapKeys(methods, (v, k) => k.toUpperCase());
        } catch (e) {
            if (fp.includes('tree')) console.log(e);
            // No file
        }

        return methods;
    }


    async get(req: Origami.Server.Request, res: Origami.Server.Response, next: Origami.Server.NextFunction) {
        // If there is already data passed, skip
        if (res.data) return next();

        let model;
        let resourceId;
        let modelName;

        try {
            ({model, resourceId, modelName} = await this._getModel(req, res));
        } catch (e) {
            if (next) return next(e);
            throw e;
        }

        const filter = resourceId ? {id: resourceId} : null;
        const data = await model.find(filter);

        // If getting a single resource, and there is none, 404
        if (!data && resourceId) return next(new Error(`${modelName}.errors.notFound`));

        res.data = data;
        res.responseCode = `${modelName}.success.${resourceId ? 'getOne' : 'getList'}`;
        if (next) await next();
    }


    async post(req: Origami.Server.Request, res: Origami.Server.Response, next?: Origami.Server.NextFunction) {
        try {
            const {model, modelName} = await this._getModel(req, res);
            res.data = await model.create(req.body);
            res.responseCode = `${modelName}.success.create`;
        } catch (e) {
            if (next) await next(e);
            else throw e;
        }
        if (next) await next();
    }


    async put(req: Origami.Server.Request, res: Origami.Server.Response, next: Origami.Server.NextFunction) {
        try {
            const {model, resourceId} = await this._getModel(req, res);
            res.data = await model.update(resourceId, req.body);
        } catch (e) {
            if (next) return next(e);
            throw e;
        }
        if (next) await next();
    }

    // TODO: Delete resource
    async delete(req: Origami.Server.Request, res: Origami.Server.Response, next: Origami.Server.NextFunction) {
        try {
            const {model, resourceId} = await this._getModel(req, res);
            res.data = await model.delete(resourceId);
        } catch (e) {
            if (next) return next(e);
            throw e;
        }
        if (next) await next();
    }


    private async _getModel(req: Origami.Server.Request, res: Origami.Server.Response) {
        const resourceId = await this.id(req);
        const modelName = resourceId ? this.parent.name : this.name;
        const model = await res.app.get('store').model(modelName);

        return {resourceId, model, modelName};
    }


    private async _setupMethod(method: string) {
        const m = method.toUpperCase() as Origami.Server.Method;
        // Look for an override in the file, otherwise do the default
        const override = await this.overrides()[m];

        (this.route.position('store')[method as keyof Route] as Function)(
            override ? override(this) : this[method as keyof APIController].bind(this)
        );
    }
}

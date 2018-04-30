import {Origami} from 'origami-core-lib';
import {Route} from '../../Router';
const pluralize = require('pluralize');

import auth from '../../middleware/auth';

export type methods = 'get' | 'head' | 'post' | 'put' | 'delete';

export interface ControllerOptions {
    model: Origami.Store.Schema;
    auth?: boolean | {
        [key in methods]: boolean;
    };
}


export default class Controller {
    resourcePlural: string;
    router: Route;


    constructor(public resource: string, public store: any, public options: ControllerOptions) {
        this.resourcePlural = pluralize(resource);

        this.router = new Route(`/api/v1/${this.resourcePlural}`);

        this.store.model(resource, options.model);

        (['get', 'post', 'delete', 'put'] as methods[]).forEach(m => {
            const rMethod = this.router[m as keyof Route] as Function;
            const cMethod = this[m as keyof Controller] as Function;

            let useAuth = false;
            if (this.options.auth) {
                if (this.options.auth === true) useAuth = true;
                else if (this.options.auth[m]) useAuth = true;
            }

            rMethod.bind(this.router)(useAuth ? auth : null, cMethod.bind(this));
        });
    }

    /**
     * Get the ID of the request
     * @param {Request} req Request object
     * @return {String} Built from RAML
     */
    id(req: Origami.Server.Request) {
        return req.params[`${this.resource}Id`];
    }


    async get(
        req: Origami.Server.Request,
        res: Origami.Server.Response,
        next: Origami.Server.NextFunction
    ) {
        // If there is already data passed, skip
        if (res.data) return next();

        let model;
        let resourceId;

        try {
            ({model, resourceId} = await this._getModel(req, res));
        } catch (e) {
            if (next) return next(e);
            throw e;
        }

        const filter = resourceId ? {id: resourceId} : null;
        const data = await model.find(filter);

        // If getting a single resource, and there is none, 404
        if (!data && resourceId) return next(new Error(`${this.resourcePlural}.errors.notFound`));

        res.data = data;
        res.responseCode = `${this.resourcePlural}.success.${resourceId ? 'getOne' : 'getList'}`;
        if (next) await next();
    }


    async post(
        req: Origami.Server.Request,
        res: Origami.Server.Response,
        next?: Origami.Server.NextFunction
    ) {
        try {
            const {model} = await this._getModel(req, res);
            res.data = await model.create(req.body);
            res.responseCode = `${this.resourcePlural}.success.create`;
        } catch (e) {
            if (next) await next(e);
            else throw e;
        }
        if (next) await next();
    }


    async put(
        req: Origami.Server.Request,
        res: Origami.Server.Response,
        next: Origami.Server.NextFunction
    ) {
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
    async delete(
        req: Origami.Server.Request,
        res: Origami.Server.Response,
        next: Origami.Server.NextFunction
    ) {
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
        const model = await res.app.get('store').model(this.resource);

        return {resourceId, model};
    }
}

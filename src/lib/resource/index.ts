import {Origami} from 'origami-core-lib';
import {Route} from '../../Router';
const pluralize = require('pluralize');

import auth from '../../middleware/auth';

export type methods = 'get' | 'head' | 'post' | 'put' | 'delete' | 'list';
export type controllers = 'list' | 'create' | 'get' | 'update' | 'delete';

export interface ResourceOptions {
    model: Origami.Store.Schema;
    auth?: boolean | {
        [key in methods]: boolean
    };
    controllers?: {
        [key in controllers]?: Origami.Server.RequestHandler
    };
}


export default class Resource {
    resourcePlural: string;
    router: Route;
    subRouter: Route;


    constructor(public resource: string, public store: any, public options: ResourceOptions) {
        this.resourcePlural = pluralize(resource);
        this.resource = pluralize.singular(resource);


        this.router = new Route(`/api/v1/${this.resourcePlural}`)
            .position('store');
        this.subRouter = this.router.route(`/:${this.resource}Id`)
            .position('store');


        (['get', 'post'] as methods[]).forEach(m => {
            const rMethod = this.router[m as keyof Route] as Function;
            let cMethod = this[m as keyof Resource] as Function;

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

            rMethod.bind(this.router)(
                this._auth.bind(this),
                cMethod.bind(this)
            );
        });

        (['get', 'delete', 'put'] as methods[]).forEach(m => {
            const rMethod = this.subRouter[m as keyof Route] as Function;
            let cMethod = this[m as keyof Resource] as Function;

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

            rMethod.bind(this.subRouter)(
                this._auth.bind(this),
                cMethod.bind(this)
            );
        });


        this.store.model(resource, options.model);
    }

    /**
     * Get the ID of the request
     * @param {Request} req Request object
     * @return {String}
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
        if (!data && resourceId) return next(new Error('resource.errors.notFound'));

        res.data = data;

        res.responseCode = `resource.success.${resourceId ? 'foundOne' : 'foundList'}`;
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
            res.responseCode = 'resource.success.created';
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
            res.responseCode = 'resource.success.updated';
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
            await model.delete(resourceId);
            res.responseCode = 'resource.success.deleted';
            delete res.data;
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


    private _auth(
        req: Origami.Server.Request,
        res: Origami.Server.Response,
        next: Origami.Server.NextFunction
    ) {
        let useAuth = null;
        const m = req.method.toLowerCase() as methods;

        if (this.options.auth) {
            if (this.options.auth === true) {
                useAuth = true;

            } else {
                let set = this.options.auth[m];
                if (!this.id(req) && m === 'get') set = this.options.auth['list'];

                if (set || set === false) useAuth = set;
            }
        }


        if (useAuth === null || useAuth) return auth(req, res, next);
        next() ;
    }
}

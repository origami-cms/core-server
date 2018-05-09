import { Origami } from 'origami-core-lib';
import { Route } from '../../Router';
export declare type methods = 'get' | 'head' | 'post' | 'put' | 'delete' | 'list';
export interface ResourceOptions {
    model: Origami.Store.Schema;
    auth?: boolean | {
        [key in methods]: boolean;
    };
}
export default class Resource {
    resource: string;
    store: any;
    options: ResourceOptions;
    resourcePlural: string;
    router: Route;
    subRouter: Route;
    constructor(resource: string, store: any, options: ResourceOptions);
    /**
     * Get the ID of the request
     * @param {Request} req Request object
     * @return {String} Built from RAML
     */
    id(req: Origami.Server.Request): any;
    get(req: Origami.Server.Request, res: Origami.Server.Response, next: Origami.Server.NextFunction): Promise<void>;
    post(req: Origami.Server.Request, res: Origami.Server.Response, next?: Origami.Server.NextFunction): Promise<void>;
    put(req: Origami.Server.Request, res: Origami.Server.Response, next: Origami.Server.NextFunction): Promise<void>;
    delete(req: Origami.Server.Request, res: Origami.Server.Response, next: Origami.Server.NextFunction): Promise<void>;
    private _getModel(req, res);
    private _auth(req, res, next);
}

import { Route } from '../../Router';
import { RAMLResource } from '../../types/RAML';
import { Origami } from 'origami-core-lib';
export default class APIController {
    parent: APIController;
    route: Route;
    private _raml;
    constructor(raml: RAMLResource, parent: APIController);
    /**
     * Singular name of the resource
     * @return {String} Built from RAML
     */
    readonly name: any;
    /**
     * Get the ID of the request
     * @param {Request} req Request object
     * @return {String} Built from RAML
     */
    id(req: Origami.Server.Request): any;
    /**
     * Finds the file of this resource, and returns any methods to override
     * default methods
     * @returns {Object} Obejct of methods
     */
    overrides(): {
        GET?: ((ctrl: APIController) => {}) | undefined;
        HEAD?: ((ctrl: APIController) => {}) | undefined;
        POST?: ((ctrl: APIController) => {}) | undefined;
        PUT?: ((ctrl: APIController) => {}) | undefined;
        DELETE?: ((ctrl: APIController) => {}) | undefined;
        CONNECT?: ((ctrl: APIController) => {}) | undefined;
        OPTIONS?: ((ctrl: APIController) => {}) | undefined;
        PATCH?: ((ctrl: APIController) => {}) | undefined;
        USE?: ((ctrl: APIController) => {}) | undefined;
    };
    get(req: Origami.Server.Request, res: Origami.Server.Response, next: Origami.Server.NextFunction): Promise<void>;
    post(req: Origami.Server.Request, res: Origami.Server.Response, next?: Origami.Server.NextFunction): Promise<void>;
    put(req: Origami.Server.Request, res: Origami.Server.Response, next: Origami.Server.NextFunction): Promise<void>;
    delete(req: Origami.Server.Request, res: Origami.Server.Response, next: Origami.Server.NextFunction): Promise<void>;
    private _getModel(req, res);
    private _setupMethod(method);
}

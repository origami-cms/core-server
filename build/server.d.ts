/// <reference types="express" />
import { Application } from 'express';
import { Origami } from 'origami-core-lib';
import { Route } from './Router';
export { Route } from './Router';
export default class Server {
    app: Application;
    store: any;
    admin: Function;
    private _positions;
    private _positionRouters;
    private _options;
    constructor(options: Origami.ConfigServer, store: any, admin: Function);
    private _setup();
    serve(): void;
    useRouter(router: Route): void;
    list(): void;
    private _generatePositions();
    private _setupMiddleware();
    private _position(pos);
}

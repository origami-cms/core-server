/// <reference types="express" />
import { Application } from 'express';
import { Origami } from 'origami-core-lib';
import { ControllerOptions } from './lib/controller';
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
    controller(resource: string, options: ControllerOptions): void;
    static(path: string): void;
    list(): void;
    private _generatePositions();
    private _setupMiddleware();
    private _setupStatic();
    private _position(pos);
}

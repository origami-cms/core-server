/// <reference types="express" />
import { Application } from 'express';
import { Origami } from 'origami-core-lib';
import { ResourceOptions } from './lib/resource';
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
    resource(name: string, options: ResourceOptions): void;
    static(path: string): void;
    list(): void;
    private _generatePositions();
    private _setupMiddleware();
    private _setupStatic();
    private _setupResources();
    private _position(pos);
}

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
    private _plugins?;
    private _server?;
    constructor(options: Origami.ConfigServer, store: any, admin: Function, plugins?: Origami.Config['plugins']);
    private _setup();
    serve(): void;
    stop(): void;
    useRouter(router: Route): void;
    resource(name: string, options: ResourceOptions): void;
    static(path: string): void;
    private _generatePositions();
    private _setupMiddleware();
    private _setupStatic();
    private _setupResources();
    private _setupPlugins();
    private _position(pos);
}

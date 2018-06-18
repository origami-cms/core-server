/// <reference types="express" />
import { Application } from 'express';
import { Origami } from 'origami-core-lib';
import { Resource } from './lib';
import { ResourceOptions } from './lib/resource';
import { Route } from './Router';
export { Route } from './Router';
export default class Server {
    app: Application;
    store: any;
    private _positions;
    private _positionRouters;
    private _options;
    private _plugins?;
    private _server?;
    constructor(options: Origami.ConfigServer, store: any);
    serve(): void;
    stop(): void;
    useRouter(router: Route): void;
    plugin(name: string, settings: Origami.Config['plugins']): Promise<void>;
    resource(name: string, options: ResourceOptions): Resource;
    static(path: string, prefix?: string): void;
    private _setup();
    private _setupPositions();
    private _setupMiddleware();
    private _setupStatic();
    private _setupDefaultPlugins();
    private _position(pos);
}

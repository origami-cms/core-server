/// <reference types="express" />
import { Application } from 'express';
import { Route } from './Router';
import { Origami } from './types/global';
export default class Server {
    app: Application;
    store: any;
    admin: Route;
    private _positions;
    private _positionRouters;
    private _options;
    constructor(options: Origami.ConfigServer, store: any, admin: Route);
    private _setup();
    serve(): void;
    useRouter(router: Route): void;
    list(): void;
    private _generatePositions();
    _setupMiddleware(): Promise<void>;
    _position(pos: Origami.Server.Position): void;
}

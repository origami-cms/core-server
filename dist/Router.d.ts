/// <reference types="express" />
import { Handler } from 'express';
import { Origami } from './types/global';
export declare type Routers = {
    [K in Origami.Server.Position]: RouterListItem[];
};
export interface RouterListItem {
    path: Origami.Server.URL;
    handlers: Handler[];
    method: Origami.Server.Method;
}
export declare class Route {
    parent?: Route;
    routers: Routers;
    nested: Route[];
    private _url;
    private _positions;
    private _activeRouter;
    private __position;
    constructor(url?: Origami.Server.URL, parent?: Route);
    private _position;
    readonly url: Origami.Server.URL;
    get(...handlers: Handler[]): this;
    post(...handlers: Handler[]): this;
    put(...handlers: Handler[]): this;
    delete(...handlers: Handler[]): this;
    all(...handlers: Handler[]): this;
    use(...handlers: Handler[]): this;
    position(position: Origami.Server.Position): this;
    route(path: Origami.Server.URL): Route;
    _route(method: Origami.Server.Method, ...handlers: Handler[]): this;
}

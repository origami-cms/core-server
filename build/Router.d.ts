import { Origami } from 'origami-core-lib';
export declare type Routers = {
    [K in Origami.Server.Position]: RouterListItem[];
};
export interface RouterListItem {
    path: Origami.Server.URL;
    handlers: Origami.Server.RequestHandler[];
    method: Origami.Server.Method;
}
export declare class Route {
    parent?: Route;
    routers: Routers;
    nested: Route[];
    private _url;
    private _positions;
    private _activeRouter;
    private _curposition;
    constructor(url?: Origami.Server.URL, parent?: Route);
    private _position;
    readonly url: Origami.Server.URL;
    get(...handlers: Origami.Server.RequestHandler[]): this;
    post(...handlers: Origami.Server.RequestHandler[]): this;
    put(...handlers: Origami.Server.RequestHandler[]): this;
    delete(...handlers: Origami.Server.RequestHandler[]): this;
    all(...handlers: Origami.Server.RequestHandler[]): this;
    use(...handlers: Origami.Server.RequestHandler[]): this;
    position(position: Origami.Server.Position): this;
    route(path: Origami.Server.URL): Route;
    private _route(method, ...handlers);
}

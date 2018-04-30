import {Origami} from 'origami-core-lib';

export type Routers = {
    [K in Origami.Server.Position]: RouterListItem[]
};

export interface RouterListItem {
    path: Origami.Server.URL;
    handlers: Origami.Server.RequestHandler[];
    method: Origami.Server.Method;
}


export class Route {
    parent?: Route;
    routers: Routers;
    nested: Route[];

    private _url: string | null | RegExp;
    private _positions: Origami.Server.Position[];
    private _activeRouter: RouterListItem[];
    private _curposition: Origami.Server.Position = 'init';

    constructor(url: Origami.Server.URL = null, parent?: Route) {
        this._url = url;
        this.parent = parent;

        // Different positions to run route at
        this._positions = [
            'init',

            'pre-store',
            'store',
            'post-store',

            'pre-render',
            'render',
            'post-render',

            'pre-send'
        ];

        // A different array of middleware for each position
        this.routers = {
            init: [],

            'pre-store': [],
            store: [],
            'post-store': [],

            'pre-render': [],
            render: [],
            'post-render': [],

            'pre-send': []
        };


        // Default position is 'render'
        this.position('pre-render');


        this.nested = [];
        this._activeRouter = this.routers['post-store'];
    }


    // If the position is changed, update the activeRouter
    private set _position(v: Origami.Server.Position) {
        if (this._positions.includes(v)) this._activeRouter = this.routers[v];
        else throw new Error(`Origami.Route: No position ${v}`);
        this._curposition = v;
    }

    private get _position(): Origami.Server.Position {
        return this._curposition;
    }

    get url(): Origami.Server.URL {
        if (this._url instanceof RegExp) return this._url;
        return `${this.parent ? this.parent.url : ''}${this._url || ''}`;
    }


    // Route methods
    get(...handlers: Origami.Server.RequestHandler[]): this {
        return this._route('GET', ...handlers);
    }
    post(...handlers: Origami.Server.RequestHandler[]): this {
        return this._route('POST', ...handlers);
    }
    put(...handlers: Origami.Server.RequestHandler[]): this {
        return this._route('PUT', ...handlers);
    }
    delete(...handlers: Origami.Server.RequestHandler[]): this {
        return this._route('DELETE', ...handlers);
    }
    all(...handlers: Origami.Server.RequestHandler[]): this {
        return this._route('USE', ...handlers);
    }
    use(...handlers: Origami.Server.RequestHandler[]): this {
        return this._route('USE', ...handlers);
    }

    // Change the position (active router)
    position(position: Origami.Server.Position) {
        this._position = position;

        return this;
    }


    // Nest a Router under itself for recursive paths
    route(path: Origami.Server.URL) {
        const r = new Route(path, this);
        r.position(this._position);
        this.nested.push(r);

        return r;
    }


    // Registers the activeRouter (set by position()) to handle on the url
    private _route(
        method: Origami.Server.Method,
        ...handlers: Origami.Server.RequestHandler[]
    ): this {
        this._activeRouter.push({
            path: this.url,
            handlers,
            method
        });

        return this;
    }
}

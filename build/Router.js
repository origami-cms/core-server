"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Route {
    constructor(url = null, parent) {
        this._curposition = 'init';
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
    set _position(v) {
        if (this._positions.includes(v))
            this._activeRouter = this.routers[v];
        else
            throw new Error(`Origami.Route: No position ${v}`);
        this._curposition = v;
    }
    get _position() {
        return this._curposition;
    }
    get url() {
        if (this._url instanceof RegExp)
            return this._url;
        return `${this.parent ? this.parent.url : ''}${this._url || ''}`;
    }
    // Route methods
    get(...handlers) {
        return this._route('GET', ...handlers);
    }
    post(...handlers) {
        return this._route('POST', ...handlers);
    }
    put(...handlers) {
        return this._route('PUT', ...handlers);
    }
    delete(...handlers) {
        return this._route('DELETE', ...handlers);
    }
    all(...handlers) {
        return this._route('USE', ...handlers);
    }
    use(...handlers) {
        return this._route('USE', ...handlers);
    }
    // Change the position (active router)
    position(position) {
        this._position = position;
        return this;
    }
    // Nest a Router under itself for recursive paths
    route(path) {
        const r = new Route(path, this);
        r.position(this._position);
        this.nested.push(r);
        return r;
    }
    // Registers the activeRouter (set by position()) to handle on the url
    _route(method, ...handlers) {
        this._activeRouter.push({
            path: this.url,
            handlers,
            method
        });
        return this;
    }
}
exports.Route = Route;

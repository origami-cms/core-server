"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const origami_core_lib_1 = require("origami-core-lib");
const path_1 = __importDefault(require("path"));
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
    /**
     * Load all routers from a file or directory and nest them
     * @param path Path to file or directory
     * @param prefix Prefix the route
     * @param recursive If true, recursively nest routes
     */
    async include(p, prefix = '/', r = true) {
        const nest = (_p) => {
            const route = require(_p);
            if (route.constructor.name === 'Route')
                return this.nested.push(route);
            origami_core_lib_1.error(`File ${_p} does not export a Route`);
            return false;
        };
        const stat = await fs_1.default.statSync(p);
        if (stat.isFile())
            return nest(p);
        if (stat.isDirectory()) {
            const list = fs_1.default.readdirSync(p);
            list.forEach(i => {
                const pathRel = path_1.default.resolve(p, i);
                const s = fs_1.default.statSync(pathRel);
                if (s.isFile() && /.*\.js$/.test(i))
                    return nest(pathRel);
                if (r && s.isDirectory())
                    return this.include(pathRel, `${p}/${i}`);
                return false;
            });
        }
        else
            return false;
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

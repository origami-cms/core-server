"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
// @ts-ignore
const corser_1 = __importDefault(require("corser"));
const express_1 = __importDefault(require("express"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const helmet_1 = __importDefault(require("helmet"));
const origami_core_lib_1 = require("origami-core-lib");
const path_1 = __importDefault(require("path"));
const defaultPlugins_1 = __importDefault(require("./defaultPlugins"));
const resource_1 = __importDefault(require("./lib/resource"));
const app_1 = __importDefault(require("./lib/app"));
const errors_1 = __importDefault(require("./middleware/errors"));
const format_1 = __importDefault(require("./middleware/format"));
const Options_1 = __importDefault(require("./Options"));
const scripts_1 = __importDefault(require("./scripts"));
const listEndPoints = require('express-list-endpoints');
const DEFAULT_PORT = 8080;
var lib_1 = require("./lib");
exports.lib = lib_1.lib;
class Server {
    constructor(options, store) {
        this.apps = {};
        this.app = express_1.default();
        this.store = store;
        // Assign these to a singleton class so they can be use across the server
        this._options = Object.assign({
            port: process.env.PORT || DEFAULT_PORT,
            ln: 'enUS'
        }, options);
        // Special override for PORT in the environment variable
        if (process.env.PORT)
            this._options.port = parseInt(process.env.PORT, 10);
        Options_1.default.options = this._options;
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
        this._positionRouters = {
            init: express_1.default.Router(),
            'pre-store': express_1.default.Router(),
            store: express_1.default.Router(),
            'post-store': express_1.default.Router(),
            'pre-render': express_1.default.Router(),
            render: express_1.default.Router(),
            'post-render': express_1.default.Router(),
            'pre-send': express_1.default.Router()
        };
        // Validate the options
        try {
            origami_core_lib_1.requireKeys(['secret'], this._options);
        }
        catch (e) {
            throw new Error(`Origami.Server: Missing '${e.key}' setting`);
        }
        this._setup();
        this.app.set('ln', this._options.ln);
        this.app.set('secret', this._options.secret);
        this.app.set('apps', this.apps);
    }
    // Runs the app
    serve() {
        this._server = this.app.listen(this._options.port);
        origami_core_lib_1.success('Server', 'Listening on port', this._options.port.toString().cyan);
        // Run the default scripts
        scripts_1.default(this);
    }
    stop() {
        if (this._server)
            this._server.close();
    }
    // Add the Router's routes in each position to the middleware
    useRouter(router) {
        this._positions.forEach(p => {
            const pr = this._positionRouters[p];
            router.routers[p].forEach(({ path, handlers, method }) => {
                const p = (path || '').toString();
                try {
                    const m = method.toLowerCase();
                    pr[m](path, handlers);
                    origami_core_lib_1.success('Server', `Connected ${p} route: `, method.toUpperCase().blue, p.blue);
                }
                catch (e) {
                    origami_core_lib_1.error('Server', new Error(`Could not connect ${method.toUpperCase().yellow} ${p.yellow}`));
                }
            });
        });
        router.nested.forEach(this.useRouter.bind(this));
    }
    async plugin(name, settings) {
        if (Boolean(settings)) {
            let plugin;
            plugin = await origami_core_lib_1.requireLib(name, __dirname, 'origami-plugin-');
            if (!plugin)
                return origami_core_lib_1.error(new Error(`Could not load plugin ${name}`));
            if (typeof plugin !== 'function') {
                return origami_core_lib_1.error(new Error(`Plugin ${name} does not export a function`));
            }
            await plugin(this, settings);
        }
    }
    async application(name, settings) {
        if (Boolean(settings)) {
            const app = new app_1.default(name, this, settings);
            await app.setup();
        }
    }
    resource(name, options) {
        const c = new resource_1.default(name, this.store, options);
        this.useRouter(c.router);
        return c;
    }
    // Wrapper for express.static
    static(path, prefix) {
        const r = new origami_core_lib_1.Route(prefix || '/');
        r.use(express_1.default.static(path));
        this.useRouter(r);
    }
    // Registers all the middleware and serves the app
    async _setup() {
        // Setup the store
        this.app.set('store', this.store);
        // Setup the default plugins
        await this._setupDefaultPlugins();
        this.app.use(express_fileupload_1.default());
        this.app.use(helmet_1.default({
            frameguard: {
                action: 'allow-from',
                domain: '*'
            }
        }));
        this.app.use(corser_1.default.create());
        await this._setupStatic();
        // Setup the middleware
        await this._setupMiddleware();
    }
    async _setupMiddleware() {
        this._position('init');
        this.app.use(body_parser_1.default.urlencoded({
            extended: true
        }));
        this.app.use(body_parser_1.default.json());
        // PRE-STORE position
        this._position('pre-store');
        this._position('store');
        this._position('post-store');
        // PRE-RENDER position
        this._position('pre-render');
        this._position('render');
        this._position('post-render');
        // Wrap for friendly errors
        this.app.use(errors_1.default);
        // PRE-SEND position
        this._position('pre-send');
        this.app.use(await format_1.default());
    }
    async _setupStatic() {
        const s = this._options.static;
        if (s) {
            if (typeof s === 'string') {
                this.static(path_1.default.resolve(process.cwd(), s));
            }
            else if (s instanceof Array) {
                s.forEach(_s => this.static(path_1.default.resolve(process.cwd(), _s)));
            }
        }
    }
    async _setupDefaultPlugins() {
        Object.entries(defaultPlugins_1.default).forEach(async ([name, settings]) => {
            await this.plugin(name, settings);
        });
    }
    // Run the middleware for the router position
    _position(pos) {
        this.app.use(this._positionRouters[pos]);
    }
}
exports.default = Server;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
}
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const origami_core_lib_1 = require("origami-core-lib");
const path_1 = __importDefault(require("path"));
const api_1 = __importDefault(require("./controllers/api"));
const theme_1 = __importDefault(require("./controllers/theme"));
const plugins = __importStar(require("./plugins"));
const lib_1 = require("./lib");
const errors_1 = __importDefault(require("./middleware/errors"));
const format_1 = __importDefault(require("./middleware/format"));
const raml_1 = __importDefault(require("./middleware/raml"));
const models_1 = __importDefault(require("./models"));
const Options_1 = __importDefault(require("./Options"));
const scripts_1 = __importDefault(require("./scripts"));
const listEndPoints = require('express-list-endpoints');
const DEFAULT_PORT = 8080;
var Router_1 = require("./Router");
exports.Route = Router_1.Route;
class Server {
    constructor(options, store, admin) {
        this.app = express_1.default();
        this.store = store;
        this.admin = admin;
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
    }
    // Registers all the middleware and serves the app
    async _setup() {
        // Setup the store
        models_1.default(this.store);
        this.app.set('store', this.store);
        this.app.use(helmet_1.default());
        await this._setupStatic();
        // Generate the position routers...
        await this._generatePositions();
        // Const content = await require('origami-core-server-content')();
        // this.useRouter(
        //     content
        // );
        // Setup the middleware
        await this._setupMiddleware();
        await this._setupResources();
        await this._setupPlugins();
        // Serve the app
        this.serve();
    }
    // Runs the app
    serve() {
        this.app.listen(this._options.port);
        origami_core_lib_1.success('Server', 'Listening on port', this._options.port.toString().cyan);
        scripts_1.default(this);
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
                    origami_core_lib_1.success('Server', `Conected ${p} route: `, method.toUpperCase().blue, p.blue);
                }
                catch (e) {
                    console.log(e);
                    origami_core_lib_1.error('Server', new Error(`Could not connect ${method.toUpperCase().yellow} ${p.yellow}`));
                }
            });
        });
        router.nested.forEach(this.useRouter.bind(this));
    }
    resource(name, options) {
        const c = new lib_1.Resource(name, this.store, options);
        this.useRouter(c.router);
    }
    // Wrapper for express.static
    static(path) {
        this.app.use(express_1.default.static(path));
    }
    // Lists all the endpoints and their methods
    list() {
        listEndPoints(this.app).forEach(({ methods: [m], path: p }) => {
            const _m = `     ${m}`.slice(-1 * 'DELETE'.length);
            console.log(' '.repeat(2), _m.toUpperCase().grey, p.magenta);
        });
    }
    async _generatePositions() {
        // Setup API
        this.useRouter(await api_1.default());
        // Load initial theme
        let initialTheme = null;
        const [setting] = await this.store.model('setting').find({ setting: 'theme' });
        if (setting)
            initialTheme = setting.value;
        const c = await origami_core_lib_1.config.read();
        if (c && c.theme) {
            if (c.theme.name)
                initialTheme = c.theme.name;
            else if (c.theme.path)
                initialTheme = c.theme.path;
        }
        // Setup Theme
        if (initialTheme)
            this.useRouter(await theme_1.default(initialTheme));
    }
    async _setupMiddleware() {
        this._position('init');
        this.app.use(body_parser_1.default.urlencoded({
            extended: true
        }));
        this.app.use(body_parser_1.default.json());
        // Setup admin
        this.app.use('/admin/', this.admin());
        // Validate the API against the RAML
        this.app.use('/api/v1', await raml_1.default());
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
                console.log(2, path_1.default.resolve(process.cwd(), s));
                this.static(path_1.default.resolve(process.cwd(), s));
            }
            else if (s instanceof Array) {
                s.forEach(_s => this.static(path_1.default.resolve(process.cwd(), _s)));
            }
        }
    }
    async _setupResources() {
        const c = await origami_core_lib_1.config.read();
        if (!c)
            return;
        if (c.resources) {
            Object.entries(c.resources).forEach(([name, r]) => {
                if (typeof r === 'string') {
                    const model = require(path_1.default.resolve(process.cwd(), r));
                    const auth = true;
                    this.resource(name, { model, auth });
                }
                else if (r instanceof Object) {
                    const model = require(path_1.default.resolve(process.cwd(), r.model));
                    const auth = r.auth;
                    this.resource(name, { model, auth });
                }
            });
        }
    }
    async _setupPlugins() {
        const c = await origami_core_lib_1.config.read();
        if (c && c.plugins) {
            Object.entries(c.plugins).forEach(([name, settings]) => {
                if (Boolean(settings)) {
                    const app = require(`origami-plugin-${name}`);
                    if (settings === true)
                        app(this);
                    else if (settings instanceof Object)
                        app(this, settings);
                }
            });
        }
        Object.entries(plugins).forEach(([name, plugin]) => {
            plugin(this);
        });
    }
    // Run the middleware for the router position
    _position(pos) {
        this.app.use((req, res, next) => {
            // console.log(req.method.yellow, req.url.yellow, pos.grey);
            next();
        }, this._positionRouters[pos]);
    }
}
exports.default = Server;

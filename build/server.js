"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
// @ts-ignore
const corser_1 = __importDefault(require("corser"));
const origami_core_lib_1 = require("origami-core-lib");
const path_1 = __importDefault(require("path"));
const api_1 = __importDefault(require("./controllers/api"));
const theme_1 = __importDefault(require("./controllers/theme"));
const plugins_1 = __importDefault(require("./plugins"));
const lib_1 = require("./lib");
const errors_1 = __importDefault(require("./middleware/errors"));
const format_1 = __importDefault(require("./middleware/format"));
const models_1 = __importDefault(require("./models"));
const Options_1 = __importDefault(require("./Options"));
const scripts_1 = __importDefault(require("./scripts"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const listEndPoints = require('express-list-endpoints');
const DEFAULT_PORT = 8080;
var Router_1 = require("./Router");
exports.Route = Router_1.Route;
class Server {
    constructor(options, store, admin, plugins) {
        this.app = express_1.default();
        this.store = store;
        this.admin = admin;
        // Assign these to a singleton class so they can be use across the server
        this._options = Object.assign({
            port: process.env.PORT || DEFAULT_PORT,
            ln: 'enUS'
        }, options);
        this._plugins = Object.assign({}, plugins_1.default, plugins);
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
            try {
                // Attempt to load the plugin as a default plugin
                plugin = require(`origami-plugin-${name}`);
            }
            catch (e) {
                // Then attempt to load it from project as a custom file...
                try {
                    plugin = require(path_1.default.resolve(name));
                }
                catch (e) {
                    // Otherwise attempt to load it from the project's node_modules
                    plugin = require(path_1.default.resolve(process.cwd(), `node_modules/origami-plugin-${name}`));
                }
            }
            if (!plugin)
                return origami_core_lib_1.error(new Error(`Could not load plugin ${name}`));
            if (typeof plugin !== 'function')
                return origami_core_lib_1.error(new Error(`Plugin ${name} does not export a function`));
            await plugin(this, settings);
        }
    }
    resource(name, options) {
        const c = new lib_1.Resource(name, this.store, options);
        this.useRouter(c.router);
    }
    // Wrapper for express.static
    static(path) {
        this.app.use(express_1.default.static(path));
    }
    // Registers all the middleware and serves the app
    async _setup() {
        // Setup the store
        models_1.default(this);
        this.app.set('store', this.store);
        this.app.use(express_fileupload_1.default());
        this.app.use(helmet_1.default({
            frameguard: {
                action: 'allow-from',
                domain: '*'
            }
        }));
        this.app.use(corser_1.default.create());
        await this._setupStatic();
        // Generate the position routers...
        await this._setupPositions();
        // Setup the middleware
        await this._setupMiddleware();
        // Setup the resources
        await this._setupResources();
        // Setup the resources
        await this._defaultPlugins();
    }
    async _setupPositions() {
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
    async _setupResources() {
        const c = this._options;
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
    async _defaultPlugins() {
        Object.entries(plugins_1.default).forEach(([name, settings]) => {
            this.plugin(name, settings);
        });
    }
    // Run the middleware for the router position
    _position(pos) {
        this.app.use(this._positionRouters[pos]);
    }
}
exports.default = Server;

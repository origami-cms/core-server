"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const listEndPoints = require('express-list-endpoints');
const origami_core_lib_1 = require("origami-core-lib");
const raml_1 = __importDefault(require("./middleware/raml"));
const errors_1 = __importDefault(require("./middleware/errors"));
const format_1 = __importDefault(require("./middleware/format"));
const models_1 = __importDefault(require("./models"));
const api_1 = __importDefault(require("./controllers/api"));
const theme_1 = __importDefault(require("./controllers/theme"));
const scripts_1 = __importDefault(require("./scripts"));
// tslint:disable-next-line
const Options_1 = __importDefault(require("./Options"));
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
            port: process.env.NODE_ENV || DEFAULT_PORT,
            ln: 'enUS'
        }, options);
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
        // Generate the position routers...
        await this._generatePositions();
        // Const content = await require('origami-core-server-content')();
        // this.useRouter(
        //     content
        // );
        // Setup the middleware
        await this._setupMiddleware();
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
        // Setup Theme
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
    // Run the middleware for the router position
    _position(pos) {
        this.app.use((req, res, next) => {
            console.log(req.method.yellow, req.url.yellow, pos.grey);
            next();
        }, this._positionRouters[pos]);
    }
}
exports.default = Server;
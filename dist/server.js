"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const raml_1 = __importDefault(require("./middleware/raml"));
const errors_1 = __importDefault(require("./middleware/errors"));
const format_1 = __importDefault(require("./middleware/format"));
const express = require('express');
const models = require('../models');
const { symbols, requireKeys, success, error } = require('origami-core-lib');
const bodyParser = require('body-parser');
const listEndPoints = require('express-list-endpoints');
const Options = require('../Options');
// Private symbols
const s = symbols([
    // Props
    'app',
    'options',
    'store',
    'admin',
    'positions',
    'positionRouters',
    // Methods
    'setup',
    'generatePositions',
    'setupMiddleware',
    'position'
]);
const DEFAULT_PORT = 8080;
class Server {
    constructor(options, store, admin) {
        this.app = express();
        this.store = store;
        this.admin = admin;
        // Assign these to a singleton class so they can be use across the server
        Options.options = this._options = Object.assign({
            port: process.env.NODE_ENV || DEFAULT_PORT,
            ln: 'enUS'
        }, options);
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
            init: [],
            'pre-store': [],
            store: [],
            'post-store': [],
            'pre-render': [],
            render: [],
            'post-render': [],
            'pre-send': []
        };
        this._positions.forEach(p => this._positionRouters[p] = new express.Router());
        // Validate the options
        try {
            requireKeys(['secret'], this._options);
        }
        catch (e) {
            throw new Error(`Origami.Server: Missing '${e.key}' setting`);
        }
        this._setup();
        this.app.set('ln', this._options.ln);
    }
    // Registers all the middleware and serves the app
    _setup() {
        return __awaiter(this, void 0, void 0, function* () {
            // Setup the store
            models(this.store);
            this.app.set('store', this.store);
            // Generate the position routers...
            yield this._generatePositions();
            // Const content = await require('origami-core-server-content')();
            // this.useRouter(
            //     content
            // );
            // Setup the middleware
            yield this._setupMiddleware();
            // Serve the app
            this.serve();
        });
    }
    // Runs the app
    serve() {
        this.app.listen(this._options.port);
        success('Server', 'Listening on port', this._options.port.toString().cyan);
    }
    // Add the Router's routes in each position to the middleware
    useRouter(router) {
        this._positions.forEach(p => {
            const pr = this._positionRouters[p];
            router.routers[p].forEach(({ path, handlers, method }) => {
                const p = (path || '').toString();
                try {
                    pr[method.toLowerCase()](path, handlers);
                    success('Server', `Conected ${p} route: `, method.toUpperCase().blue, p.blue);
                }
                catch (e) {
                    console.log(e);
                    error('Server', new Error(`Could not connect ${method.toUpperCase().yellow} ${p.yellow}`));
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
    _generatePositions() {
        return __awaiter(this, void 0, void 0, function* () {
            // Setup API
            this.useRouter(yield require('../controllers/api')());
            // Load initial theme
            let initialTheme = null;
            const [setting] = yield this.store.model('setting').find({ setting: 'theme' });
            if (setting)
                initialTheme = setting.value;
            // Setup Theme
            this.useRouter(yield require('../controllers/theme')(initialTheme));
        });
    }
    _setupMiddleware() {
        return __awaiter(this, void 0, void 0, function* () {
            this._position('init');
            this.app.use(bodyParser.urlencoded({
                extended: true
            }));
            this.app.use(bodyParser.json());
            // Setup admin
            this.app.use('/admin/', this.admin());
            // Validate the API against the RAML
            this.app.use('/api/v1', yield raml_1.default());
            // PRE-STORE position
            this._position('pre-store');
            this._position('store');
            this._position('post-store');
            // PRE-RENDER position
            this._position('pre-render');
            this._position('render');
            this._position('post-render');
            // Wrap for friendly errors
            this.app.use(yield errors_1.default());
            // PRE-SEND position
            this._position('pre-send');
            this.app.use(yield format_1.default());
        });
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

import {Application, Router, Request, Response, NextFunction} from "express";
import {Route, RouterListItem} from "./Router";
import {Origami} from "./types/global";

import mwRaml from './middleware/raml';
import mwErrors from './middleware/errors';
import mwFormat from './middleware/format';


const express = require('express');
const models = require('../models');
const {symbols, requireKeys, success, error} = require('origami-core-lib');
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


type positionRouters = {
    [K in Origami.Server.Position]: Router[]
};


const DEFAULT_PORT = 8080;


module.exports = class Server {
    app: Application
    store: any
    admin: Route

    private _positions: Origami.Server.Position[];
    private _positionRouters: positionRouters;
    private _options: Origami.ConfigServer

    constructor(options: Origami.ConfigServer, store: any, admin: Route) {
        this.app = express();
        this.store = store;
        this.admin = admin;


        // Assign these to a singleton class so they can be use across the server
        Options.options = this._options = {
            ...{
                port: process.env.NODE_ENV || DEFAULT_PORT,
                ln: 'enUS'
            }, ...options
        };


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
            'init': [],

            'pre-store': [],
            'store': [],
            'post-store': [],

            'pre-render': [],
            'render': [],
            'post-render': [],

            'pre-send': []
        };

        this._positions.forEach(p => this._positionRouters[p] = new express.Router());


        // Validate the options
        try {
            requireKeys(['secret'], this._options);
        } catch (e) {
            throw new Error(`Origami.Server: Missing '${e.key}' setting`);
        }

        this._setup();


        this.app.set('ln', this._options.ln);
    }


    // Registers all the middleware and serves the app
    private async _setup() {
        // Setup the store
        models(this.store);
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
        success('Server', 'Listening on port', this._options.port.toString().cyan);
    }


    // Add the Router's routes in each position to the middleware
    useRouter(router: Route) {
        this._positions.forEach(p => {
            const pr: Router[] = this._positionRouters[p];
            interface obj {
                path: Origami.Server.URL,
                handlers: Function[],
                method: Origami.Server.Method
            }
            router.routers[p].forEach(({ path, handlers, method }: RouterListItem) => {
                const p = (path || '').toString();
                try {
                    pr[method.toLowerCase()](path, handlers);
                    success('Server', `Conected ${p} route: `, method.toUpperCase().blue, p.blue);
                } catch (e) {
                    console.log(e);
                    error('Server', new Error(`Could not connect ${method.toUpperCase().yellow} ${p.yellow}`));
                }
            });
        });
        router.nested.forEach(this.useRouter.bind(this));
    }


    // Lists all the endpoints and their methods
    list() {
        interface endpoint {
            methods: string[],
            path: string
        }
        listEndPoints(this.app).forEach(({ methods: [m], path: p }: endpoint) => {
            const _m = `     ${m}`.slice(-1 * 'DELETE'.length);
            console.log(' '.repeat(2), _m.toUpperCase().grey, p.magenta);
        });
    }


    private async _generatePositions() {
        // Setup API
        this.useRouter(
            await require('../controllers/api')()
        );

        // Load initial theme
        let initialTheme = null;
        const [setting] = await this.store.model('setting').find({ setting: 'theme' });
        if (setting) initialTheme = setting.value;

        // Setup Theme
        this.useRouter(await require('../controllers/theme')(initialTheme));
    }

    async _setupMiddleware() {

        this._position('init');


        this.app.use(bodyParser.urlencoded({
            extended: true
        }));
        this.app.use(bodyParser.json());


        // Setup admin
        this.app.use('/admin/', this.admin());


        // Validate the API against the RAML
        this.app.use('/api/v1', await mwRaml());


        // PRE-STORE position
        this._position('pre-store');
        this._position('store');
        this._position('post-store');


        // PRE-RENDER position
        this._position('pre-render');
        this._position('render');
        this._position('post-render');


        // Wrap for friendly errors
        this.app.use(await mwErrors());


        // PRE-SEND position
        this._position('pre-send');
        this.app.use(await mwFormat());
    }

    // Run the middleware for the router position
    _position(pos: Origami.Server.Position) {
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            console.log(req.method.yellow, req.url.yellow, pos.grey);
            next();
        }, this._positionRouters[pos]);
    }
};

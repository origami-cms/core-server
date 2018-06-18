import bodyParser from 'body-parser';
import express, {Application, NextFunction, Request, Response, Router} from 'express';
import helmet from 'helmet';
// @ts-ignore
import corser from 'corser';
import {config, error, Origami, requireKeys, success, info} from 'origami-core-lib';
import path from 'path';

import api from './controllers/api';
import theme from './controllers/theme';
import defaultPlugins from './plugins';
import {Resource} from './lib';
import {ResourceOptions} from './lib/resource';
import mwErrors from './middleware/errors';
import mwFormat from './middleware/format';
import models from './models';
import Options from './Options';
import {Route, RouterListItem} from './Router';
import runScripts from './scripts';
import upload from 'express-fileupload';
import {Http2Server} from 'http2';

const listEndPoints = require('express-list-endpoints');

type positionRouters = {
    [K in Origami.Server.Position]: Router
};


const DEFAULT_PORT = 8080;


export {Route} from './Router';

export default class Server {
    app: Application;
    store: any;
    admin: Function;

    private _positions: Origami.Server.Position[];
    private _positionRouters: positionRouters;
    private _options: Origami.ConfigServer;
    private _plugins?: Origami.Config['plugins'];
    private _server?: Http2Server;


    constructor(
        options: Origami.ConfigServer,
        store: any,
        admin: Function
    ) {

        this.app = express();
        this.store = store;
        this.admin = admin;


        // Assign these to a singleton class so they can be use across the server
        this._options = {
            ... {
                port: process.env.PORT || DEFAULT_PORT,
                ln: 'enUS'
            }, ...options
        };

        // Special override for PORT in the environment variable
        if (process.env.PORT) this._options.port = parseInt(process.env.PORT, 10);


        Options.options = this._options;


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
            init: express.Router(),

            'pre-store': express.Router(),
            store: express.Router(),
            'post-store': express.Router(),

            'pre-render': express.Router(),
            render: express.Router(),
            'post-render': express.Router(),

            'pre-send': express.Router()
        };


        // Validate the options
        try {
            requireKeys(['secret'], this._options);
        } catch (e) {
            throw new Error(`Origami.Server: Missing '${e.key}' setting`);
        }

        this._setup();


        this.app.set('ln', this._options.ln);
    }


    // Runs the app
    serve() {
        this._server = this.app.listen(this._options.port);
        success('Server', 'Listening on port', this._options.port.toString().cyan);

        // Run the default scripts
        runScripts(this);
    }


    stop() {
        if (this._server) this._server.close();
    }


    // Add the Router's routes in each position to the middleware
    useRouter(router: Route) {
        this._positions.forEach(p => {
            const pr = this._positionRouters[p];

            interface obj {
                path: Origami.Server.URL;
                handlers: Function[];
                method: Origami.Server.Method;
            }
            router.routers[p].forEach(({path, handlers, method}: RouterListItem) => {
                const p = (path || '').toString();
                try {
                    const m = method.toLowerCase() as keyof Router;
                    (pr[m] as Function)(path, handlers);
                    success('Server', `Connected ${p} route: `, method.toUpperCase().blue, p.blue);
                } catch (e) {
                    error(
                        'Server',
                        new Error(`Could not connect ${method.toUpperCase().yellow} ${p.yellow}`)
                    );
                }
            });
        });
        router.nested.forEach(this.useRouter.bind(this));
    }


    async plugin(name: string, settings: Origami.Config['plugins']) {
        if (Boolean(settings)) {
            let plugin;

            try {
                // Attempt to load the plugin as a default plugin
                plugin = require(`origami-plugin-${name}`);
            } catch (e) {
                // Then attempt to load it from project as a custom file...
                try {
                    plugin = require(path.resolve(name));
                } catch (e) {
                    // Otherwise attempt to load it from the project's node_modules
                    plugin = require(path.resolve(process.cwd(), `node_modules/origami-plugin-${name}`));
                }
            }


            if (!plugin) return error(new Error(`Could not load plugin ${name}`));
            if (typeof plugin !== 'function') return error(new Error(`Plugin ${name} does not export a function`));

            await plugin(this, settings);
        }
    }


    resource(name: string, options: ResourceOptions) {
        const c = new Resource(name, this.store, options);
        this.useRouter(c.router);
        return c;
    }


    // Wrapper for express.static
    static(path: string) {
        this.app.use(express.static(path));
    }


    // Registers all the middleware and serves the app
    private async _setup() {
        // Setup the store
        models(this);
        this.app.set('store', this.store);

        this.app.use(upload());
        this.app.use(helmet({
            frameguard: {
                action: 'allow-from',
                domain: '*'
            }
        }));
        this.app.use(corser.create());


        await this._setupStatic();

        // Generate the position routers...
        await this._setupPositions();

        // Setup the middleware
        await this._setupMiddleware();

        // Setup the default plugins
        await this._setupDefaultPlugins();
    }


    private async _setupPositions() {
        // Setup API
        this.useRouter(
            await api()
        );

        // Load initial theme
        let initialTheme = null;
        const [setting] = await this.store.model('setting').find({setting: 'theme'});
        if (setting) initialTheme = setting.value;
        const c = await config.read();
        if (c && c.theme) {
            if (c.theme.name) initialTheme = c.theme.name;
            else if (c.theme.path) initialTheme = c.theme.path;
        }

        // Setup Theme
        if (initialTheme) this.useRouter(await theme(initialTheme));
    }


    private async _setupMiddleware() {

        this._position('init');


        this.app.use(bodyParser.urlencoded({
            extended: true
        }));
        this.app.use(bodyParser.json());


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
        this.app.use(mwErrors);


        // PRE-SEND position
        this._position('pre-send');
        this.app.use(await mwFormat());
    }


    private async _setupStatic() {
        const s = this._options.static;
        if (s) {
            if (typeof s === 'string') {
                this.static(path.resolve(process.cwd(), s));
            } else if (s instanceof Array) {
                s.forEach(_s => this.static(path.resolve(process.cwd(), _s)));
            }
        }
    }


    private async _setupDefaultPlugins() {
        Object.entries(defaultPlugins).forEach(([name, settings]) => {
            this.plugin(name, settings);
        });
    }


    // Run the middleware for the router position
    private _position(pos: Origami.Server.Position) {
        this.app.use(this._positionRouters[pos]);
    }
}

import bodyParser from 'body-parser';
// @ts-ignore
import corser from 'corser';
import express, {Application, Router} from 'express';
import upload from 'express-fileupload';
// @ts-ignore
import staticGzip from 'express-static-gzip';
import helmet from 'helmet';
import {Http2Server} from 'http2';
import {error, Origami, requireKeys, requireLib, Route, RouterListItem, success} from 'origami-core-lib';
import path from 'path';
import defaultPlugins from './defaultPlugins';
import App from './lib/app';
import Resource, {ResourceOptions} from './lib/resource';
import mwErrors from './middleware/errors';
import mwFormat from './middleware/format';
import Options from './Options';
import runScripts from './scripts';

type positionRouters = {
    [K in Origami.Server.Position]: Router
};


const DEFAULT_PORT = 8080;

export {lib} from './lib';
export default class Server {
    app: Application;
    store: any;
    apps: {[name: string]: Origami.AppManifest} = {};

    private _positions: Origami.Server.Position[];
    private _positionRouters: positionRouters;
    private _options: Origami.ConfigServer;
    private _plugins?: Origami.Config['plugins'];
    private _server?: Http2Server;
    private _namedMiddleware: {[name: string]: Origami.Server.RequestHandler} = {};


    constructor(
        options: Origami.ConfigServer,
        store: any
    ) {
        this.app = express();
        this.store = store;


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
        this.app.set('secret', this._options.secret);
        this.app.set('apps', this.apps);
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


            router.routers[p].forEach(({path, handlers, method}: RouterListItem) => {
                // Convert all the named handlers (EG: router.use('auth')) into request handlers
                const mappedNamedHandlers = handlers.map(h => {
                    if (typeof h === 'function') return h;
                    if (!this._namedMiddleware[h]) {
                        error('Server', `Cannot load middleware with name '${h}'`);
                        return;
                    }
                    return this._namedMiddleware[h];
                }).filter(h => h);

                const p = (path || '').toString();
                try {
                    const m = method.toLowerCase() as keyof Router;
                    (pr[m] as Function)(path, mappedNamedHandlers);
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


    async plugin(name: string, settings: boolean | object) {
        if (Boolean(settings)) {
            let plugin;

            plugin = await requireLib(name, __dirname, 'origami-plugin-');

            if (!plugin) return error(new Error(`Could not load plugin ${name}`));
            if (typeof plugin !== 'function') {
                return error(new Error(`Plugin ${name} does not export a function`));
            }

            await plugin(this, settings);
        }
    }


    async application(name: string, settings: boolean | object) {
        if (Boolean(settings)) {
            const app = new App(name, this, settings);
            await app.setup();
        }
    }


    resource(name: string, options: ResourceOptions) {
        const c = new Resource(name, this.store, options);
        this.useRouter(c.router);
        return c;
    }


    namedMiddleware(name: string, handler: Origami.Server.RequestHandler) {
        if (this._namedMiddleware[name]) {
            return error('Server', `Middleware handler with name '${name}' already exists`);
        }

        this._namedMiddleware[name] = handler;
    }


    // Wrapper for staticGzip
    static(path: string, prefix?: string) {
        const r = new Route(prefix || '/');
        // r.use(express.static(path));
        r.use(staticGzip(path));
        this.useRouter(r);
    }


    // Registers all the middleware and serves the app
    private async _setup() {
        // Setup the store
        this.app.set('store', this.store);


        // Setup the default plugins
        await this._setupDefaultPlugins();


        this.app.use(upload());
        this.app.use(helmet({
            frameguard: {
                action: 'allow-from',
                domain: '*'
            }
        }));
        this.app.use(corser.create());


        await this._setupStatic();

        // Setup the middleware
        await this._setupMiddleware();
    }


    private async _setupMiddleware() {

        this._position('init');


        this.app.use(bodyParser.urlencoded({
            extended: true
        }));
        this.app.use(bodyParser.json());


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
        Object.entries(defaultPlugins).forEach(async ([name, settings]) => {
            await this.plugin(name, settings);
        });
    }


    // Run the middleware for the router position
    private _position(pos: Origami.Server.Position) {
        this.app.use(this._positionRouters[pos]);
    }
}

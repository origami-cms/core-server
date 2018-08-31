import express from 'express';
import {readdir} from 'fs';
import {error, Origami, requireLib, resolveLib, Route, config} from 'origami-core-lib';
import path from 'path';
import {promisify} from 'util';
import Server from '../../server';

const readDir = promisify(readdir);

export default class App {
    manifest?: Origami.AppManifest;
    router?: Route;

    private _prefix = '/api/v1/apps/';
    private _dir?: string;

    constructor(
        public name: string,
        public server: Server,
        public settings: boolean | object
    ) {
    }

    get appName() {
        if (!this.manifest) return false;
        return this.manifest.name.replace(/\s/g, '-').toLowerCase();
    }

    get api() {
        if (!this.appName) return false;
        return this._prefix + this.appName;
    }


    async setup() {
        await this._loadManifest() as Origami.AppManifest;

        // Attempt to register the app on the Server
        this._registerApp();


        // Create the main router for the app
        this.router = new Route(this.api as string);


        // Initialize the app router (/api/v1/apps/:appName)
        this.server.useRouter(
            this._setupFileRouter() as Route
        );

        await this._setupAppModels();
        await this._setupAppRoutes();
        await this._setupAppResources();
    }


    // Load the app's manifest file, and throw error if there is none
    private async _loadManifest() {
        const location = [`${this.name}/manifest.js`, process.cwd(), 'origami-app-'];
        const manifest: Origami.AppManifest = await requireLib.apply(this, location);

        if (!manifest) return error(new Error(`Could not load app ${this.name}`));
        this._dir = path.dirname(await resolveLib.apply(this, location) as string);


        this.manifest = manifest;
        return manifest;
    }


    private _registerApp() {
        const name = this.appName;
        if (!this.manifest || !name) return error(new Error('App\'s manifest is not loaded'));

        // If it's already registered, throw an error
        if (this.server.apps[name]) {
            return error(new Error(`Application ${name} is already registered`));
        }

        this.server.apps[name] = this.manifest;
    }


    private _setupFileRouter() {
        if (!this.manifest || !this._dir) return error(new Error('App\'s manifest is not loaded'));


        ['pages', 'scripts'].forEach(dir => this.router!
            .route(`/${dir}`)
            // TODO: convert to gzip serve
            .use(express.static(path.resolve(this._dir as string, dir)))
        );

        // Setup basic route for retrieving the manifest
        // EG: GET /api/v1/apps/:appName
        this.router!.get((req, res, next) => {
            res.data = this.manifest;
            next();
        });

        return this.router;
    }


    private async _setupAppModels() {
        return this._loadFiles('models', (f, model) => {
            this.server.store.model(f, model);
        });
    }

    private async _setupAppRoutes() {
        return this._loadFiles('routes', (f, route) => {
            if (typeof route !== 'function') {
                return error(new Error(
                    `Application ${this.name} has route '${f}' that does not export a function`
                ));
            }
            route(this.server, this.settings);
        });
    }

    private async _setupAppResources() {
        if (this.manifest!.resources) {
            config.setupResources(
                // @ts-ignore
                {resources: this.manifest!.resources},
                this.server,
                this._dir
            );
        }
    }


    // Run a function over each file in the app's subdirectory (route, model, etc)
    private async _loadFiles(
        type: 'routes' | 'models',
        func: (f: string, m: any) => void,
        filetype: string = 'js'
    ) {

        const fp = path.join(this._dir as string, type);
        let files;

        try {
            files = (await readDir(fp))
                .filter(f => f.endsWith(`.${filetype}`))
                .map(f => path.join(fp, f));
        // No folder
        } catch { return false; }

        try {
            return files.map(f => func(
                path.basename(f).slice(0, (filetype.length + 1) * -1),
                require(f)
            ));
        } catch (e) {
            error(`Error in loading app '${this.name}' ${type}`, e);
        }
    }
}

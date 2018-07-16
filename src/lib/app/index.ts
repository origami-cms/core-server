import {Origami, requireLib, error, Route, resolveLib} from 'origami-core-lib';
import Server from '../../server';
import express from 'express';
import path from 'path';

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
        const m = await this._loadManifest() as Origami.AppManifest;

        // Attempt to register the app on the Server
        this._registerApp();

        // Initialize the app router (/api/v1/apps/:appName)
        this.server.useRouter(
            this._setupRouter() as Route
        );
    }


    // Load the app's manifest file, and throw error if there is none
    private async _loadManifest() {
        const location = [`${this.name}/manifest.js`, __dirname, 'origami-app-'];
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


    private _setupRouter() {
        if (!this.manifest || !this._dir) return error(new Error('App\'s manifest is not loaded'));

        // Create the main router for the app
        const r = this.router = new Route(this.api as string);

        ['pages', 'scripts'].forEach(dir => r
            .route(`/${dir}`)
            .use(express.static(path.resolve(this._dir as string, dir)))
        );


        // Setup basic route for retrieving the manifest
        // EG: GET /api/v1/apps/:appName
        this.router.get((req, res, next) => {
            res.data = this.manifest;
            next();
        });

        return this.router;
    }
}

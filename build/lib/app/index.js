"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = require("fs");
const origami_core_lib_1 = require("origami-core-lib");
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const readDir = util_1.promisify(fs_1.readdir);
class App {
    constructor(name, server, settings) {
        this.name = name;
        this.server = server;
        this.settings = settings;
        this._prefix = '/api/v1/apps/';
    }
    get appName() {
        if (!this.manifest)
            return false;
        return this.manifest.name.replace(/\s/g, '-').toLowerCase();
    }
    get api() {
        if (!this.appName)
            return false;
        return this._prefix + this.appName;
    }
    async setup() {
        await this._loadManifest();
        // Attempt to register the app on the Server
        this._registerApp();
        // Create the main router for the app
        this.router = new origami_core_lib_1.Route(this.api);
        // Initialize the app router (/api/v1/apps/:appName)
        this.server.useRouter(this._setupFileRouter());
        await this._setupAppModels();
        await this._setupAppRoutes();
        await this._setupAppResources();
    }
    // Load the app's manifest file, and throw error if there is none
    async _loadManifest() {
        const location = [`${this.name}/manifest.js`, process.cwd(), 'origami-app-'];
        const manifest = await origami_core_lib_1.requireLib.apply(this, location);
        if (!manifest)
            return origami_core_lib_1.error(new Error(`Could not load app ${this.name}`));
        this._dir = path_1.default.dirname(await origami_core_lib_1.resolveLib.apply(this, location));
        this.manifest = manifest;
        return manifest;
    }
    _registerApp() {
        const name = this.appName;
        if (!this.manifest || !name)
            return origami_core_lib_1.error(new Error('App\'s manifest is not loaded'));
        // If it's already registered, throw an error
        if (this.server.apps[name]) {
            return origami_core_lib_1.error(new Error(`Application ${name} is already registered`));
        }
        this.server.apps[name] = this.manifest;
    }
    _setupFileRouter() {
        if (!this.manifest || !this._dir)
            return origami_core_lib_1.error(new Error('App\'s manifest is not loaded'));
        ['pages', 'scripts'].forEach(dir => this.router
            .route(`/${dir}`)
            .use(express_1.default.static(path_1.default.resolve(this._dir, dir))));
        // Setup basic route for retrieving the manifest
        // EG: GET /api/v1/apps/:appName
        this.router.get((req, res, next) => {
            res.data = this.manifest;
            next();
        });
        return this.router;
    }
    async _setupAppModels() {
        if (!this.server.store)
            return;
        return this._loadFiles('models', (f, model) => {
            this.server.store.model(f, model);
        });
    }
    async _setupAppRoutes() {
        return this._loadFiles('routes', (f, route) => {
            if (typeof route !== 'function') {
                return origami_core_lib_1.error(new Error(`Application ${this.name} has route '${f}' that does not export a function`));
            }
            route(this.server, this.settings);
        });
    }
    async _setupAppResources() {
        if (this.manifest.resources) {
            origami_core_lib_1.config.setupResources(
            // @ts-ignore
            { resources: this.manifest.resources }, this.server, this._dir);
        }
    }
    // Run a function over each file in the app's subdirectory (route, model, etc)
    async _loadFiles(type, func, filetype = 'js') {
        const fp = path_1.default.join(this._dir, type);
        let files;
        try {
            files = (await readDir(fp))
                .filter(f => f.endsWith(`.${filetype}`))
                .map(f => path_1.default.join(fp, f));
            // No folder
        }
        catch (_a) {
            return false;
        }
        try {
            return files.map(f => func(path_1.default.basename(f).slice(0, (filetype.length + 1) * -1), require(f)));
        }
        catch (e) {
            origami_core_lib_1.error(`Error in loading app '${this.name}' ${type}`, e);
        }
    }
}
exports.default = App;

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
        const m = await this._loadManifest();
        // Attempt to register the app on the Server
        this._registerApp();
        // Initialize the app router (/api/v1/apps/:appName)
        this.server.useRouter(this._setupFileRouter());
        this._setupAppRoutes();
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
        // Create the main router for the app
        const r = this.router = new origami_core_lib_1.Route(this.api);
        ['pages', 'scripts'].forEach(dir => r
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
    async _setupAppRoutes() {
        try {
            const routesPath = path_1.default.join(this._dir, 'routes');
            (await readDir(routesPath))
                .filter(f => f.endsWith('.js'))
                .forEach(f => {
                const route = require(path_1.default.join(routesPath, f));
                route(this.server, this.settings);
            });
        }
        catch (_a) { }
    }
}
exports.default = App;

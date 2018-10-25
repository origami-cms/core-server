import express from 'express';
import fs from 'fs';
import {error, Origami, requireLib, resolveLib, Route, config} from 'origami-core-lib';
import path from 'path';
import {promisify} from 'util';
import Server from '../../server';

const readDir = promisify(fs.readdir);
const stat = promisify(fs.stat);


export namespace App {
    export interface EntryResponse {
        name: string;
        icon: string;
        uriBase: string;
        scripts: string[];
    }

    export class App {
        manifest?: Origami.AppManifest;
        entry: EntryResponse | false = false;
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

        get icon() {
            if (!this.manifest || !this._dir) return false;
            const icon = this.manifest.icon || 'icon.svg';
            return path.resolve(this._dir, icon);
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


        /** Load the app's manifest file, and throw error if there is none  */
        private async _loadManifest() {
            const location = [`${this.name}/origami.app`, process.cwd(), 'origami-app-'];
            const manifest: Origami.AppManifest = await requireLib.apply(this, location);

            if (!manifest) return error(new Error(`Could not load app ${this.name}`));
            this._dir = path.dirname(await resolveLib.apply(this, location) as string);


            if (!manifest.icon || typeof manifest.icon !== 'string') {
                return error(new Error(`App ${this.name} has an invalid icon in it's config`));
            }


            this.manifest = manifest;
            this.entry = this._convertManifestToEntry();

            return manifest;
        }


        /** Register the app in the Server and throws error if namespace is taken */
        private _registerApp() {
            const name = this.appName;
            if (!this.manifest || !name) return error(new Error(`App ${this.name}'s manifest is not loaded`));

            // If it's already registered, throw an error
            if (this.server.apps[name]) {
                return error(new Error(`Application ${name} is already registered`));
            }

            this.server.apps[name] = this;
        }


        /** Generate MW for serving files and app manifest */
        private _setupFileRouter() {
            if (!this.manifest || !this._dir) {
                return error(new Error(`App ${this.name}'s manifest is not loaded`));
            }


            // Entry or entry element
            this.router!.route('/entry').get('auth', async(req, res, next) => {

                let element;
                let file = 'index.html';

                if (this.manifest!.admin) {
                    element = this.manifest!.admin!.entryElement;
                    if (this.manifest!.admin!.entry) file = this.manifest!.admin!.entry!;
                }

                if (element) return res.send(`<${element}></${element}>`);

                const entryPath = path.resolve(this._dir!, file);

                try {
                    if ((await stat(entryPath)).isFile()) return res.sendFile(entryPath);
                } catch (e) {
                    return next();
                }

                next();
            });


            // Serve these directories from the root of the app
            ['public'].forEach(dir => this.router!
                .route(`/${dir}`)
                // TODO: convert to gzip serve
                // @ts-ignore Is a valid request handler
                .use(express.static(path.resolve(this._dir as string, dir)))
            );


            // Setup basic route for retrieving the manifest
            // EG: GET /api/v1/apps/:appName
            this.router!.get('auth', (req, res, next) => {
                if (this.entry) res.data = this.entry;
                next();
            });


            // App icon serving
            const icon = this.icon;
            if (icon) {
                this.router!.route('/icon').use(
                    // @ts-ignore Is a valid request handler
                    express.static(icon)
                );
            }

            return this.router;
        }


        private async _setupAppModels() {
            if (!this.server.store) return;
            return this._loadFilesInAppDir('models', (f, model) => {
                this.server.store.model(f, model);
            });
        }


        /** Loads all the routes in appDir/routes and runs the function with the app settings */
        private async _setupAppRoutes() {
            return this._loadFilesInAppDir('routes', (f, route) => {
                if (typeof route !== 'function') {
                    return error(new Error(
                        `App ${this.name} has route '${f}' that does not export a function`
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


        /** Run a function over each file in the app's subdirectory (route, model, etc) */
        private async _loadFilesInAppDir(
            type: 'routes' | 'models',
            func: (f: string, m: any) => void,
            filetype: string = 'js'
        ) {

            const fp = path.join(this._dir as string, type);
            let files;

            // Load the filtered files with the given filetype
            try {
                files = (await readDir(fp))
                    .filter(f => f.endsWith(`.${filetype}`))
                    .map(f => path.join(fp, f));
            // No folder
            } catch { return false; }

            try {
                // Run a function over each file and return the map
                return files.map(f => func(
                    path.basename(f).slice(0, (filetype.length + 1) * -1),
                    require(f)
                ));
            } catch (e) {
                error(`Error in loading app '${this.name}' ${type}`, e);
            }
        }

        private _convertManifestToEntry() {
            const m = this.manifest;
            if (!m) return false;

            const returning: EntryResponse = {
                name: m.name,
                icon: `${this.api}/icon`,
                uriBase: m.name,
                scripts: []
            };

            const a = m.admin;
            if (a) {
                if (a.uriBase) returning.uriBase = a.uriBase;
                if (a.entryScripts) returning.scripts = a.entryScripts;
            }

            return returning;
        }
    }

}

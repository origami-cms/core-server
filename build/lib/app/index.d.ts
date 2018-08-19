import { Origami, Route } from 'origami-core-lib';
import Server from '../../server';
export default class App {
    name: string;
    server: Server;
    settings: boolean | object;
    manifest?: Origami.AppManifest;
    router?: Route;
    private _prefix;
    private _dir?;
    constructor(name: string, server: Server, settings: boolean | object);
    readonly appName: string | boolean;
    readonly api: string | boolean;
    setup(): Promise<void>;
    private _loadManifest();
    private _registerApp();
    private _setupFileRouter();
    private _setupAppModels();
    private _setupAppRoutes();
    private _setupAppResources();
    private _loadFiles(type, func, filetype?);
}

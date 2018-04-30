"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const recursive_readdir_1 = __importDefault(require("recursive-readdir"));
const util_1 = require("util");
const lodash_1 = __importDefault(require("lodash"));
const Renderer_1 = __importDefault(require("./Renderer"));
const fsReadDir = util_1.promisify(fs_1.default.readdir);
const fsReadFile = util_1.promisify(fs_1.default.readFile);
const DEFAULT_THEME = 'snow';
const MODULE_PREFIX = 'origami-theme-';
exports.default = new class Theme {
    constructor() {
        this.config = {
            name: ''
        };
    }
    // Path to the theme module folder from the root project
    get pathTheme() {
        const localPath = path_1.default.resolve(process.cwd(), this.config.name);
        const modulePath = path_1.default.resolve(process.cwd(), 'node_modules', MODULE_PREFIX + this.config.name);
        if (fs_1.default.existsSync(localPath))
            return localPath;
        return modulePath;
    }
    // Path to the pages folder relative to the theme module
    get pathPages() {
        return path_1.default.join(this.pathTheme, '/views/pages');
    }
    // Path to the templates folder relative to the theme module
    get pathTemplates() {
        return path_1.default.join(this.pathTheme, '/views/templates');
    }
    // Path to the styles folder relative to the theme module
    get pathStyles() {
        return path_1.default.join(this.pathTheme, '/styles');
    }
    // Path to the routes folder relative to the theme module
    get pathRoutes() {
        return path_1.default.join(this.pathTheme, '/routes');
    }
    // Retrieve a list of, or indivual templates from the theme folder
    async templates(template) {
        const transform = (f) => ({
            name: path_1.default.basename(f, path_1.default.extname(f)),
            type: path_1.default.extname(f).slice(1),
            template: ''
        });
        if (template) {
            const file = await this._getFile(template.toLowerCase(), this.pathTemplates);
            if (!file)
                throw new Error('general.errors.notFound');
            const parsed = path_1.default.parse(file);
            const config = `${parsed.dir}/${parsed.name}.json`;
            const returning = transform(file);
            returning.template = (await fsReadFile(file)).toString();
            try {
                returning.config = require(config);
            }
            catch (e) {
                // No config file
            }
            return returning;
        }
        return (await recursive_readdir_1.default(this.pathTemplates))
            .filter(f => path_1.default.extname(f) !== '.json')
            .map(transform);
    }
    async routes() {
        try {
            return (await recursive_readdir_1.default(this.pathRoutes))
                .filter(f => path_1.default.extname(f) === '.js');
        }
        catch (e) {
            return [];
        }
    }
    // Load the theme file and set it to the config
    load(theme) {
        this.config.name = theme;
        this.config = require(path_1.default.resolve(this.pathTheme, 'theme.json'));
        this.config.paths = lodash_1.default.mapValues(this.config.paths, v => path_1.default.resolve(this.pathTheme, v));
    }
    getPageTypeProperties(type) {
        try {
            return require(path_1.default.resolve(this.pathTemplates, `${type}.json`)).properties;
        }
        catch (e) {
            throw new Error(`Template '${type}' has no associated .json config file`);
        }
    }
    renderPage(p, data = {}) {
        return this._renderPage(p, data, this.pathPages);
    }
    renderTemplate(p, data = {}) {
        return this._renderPage(p, data, this.pathTemplates);
    }
    renderStyles(p) {
        return this._renderStyles(p);
    }
    async _renderPage(p, data, prefix) {
        const file = await this._getFile(p, prefix);
        if (!file)
            return false;
        return Renderer_1.default.render(this.config.name, file, { page: data, site: {} });
    }
    async _renderStyles(p) {
        const _p = p.split('.').slice(0, -1).join('.');
        const file = await this._getFile(_p, this.pathStyles);
        if (!file)
            throw new Error('general.errors.notFound');
        return Renderer_1.default.render(this.config.name, file);
    }
    // Lookup a theme page file url based on request url
    async _getFile(url, prefix) {
        let p = url;
        // Allow for index at / resources
        if (p.slice(-1) === '/')
            p += 'index';
        p = path_1.default.join(prefix, p);
        let files;
        try {
            const parent = path_1.default.dirname(p);
            files = (await fsReadDir(parent))
                .filter(f => path_1.default.extname(f) !== '.json');
        }
        catch (e) {
            // If the file cannot be resolved, return false
            return false;
        }
        // Loop over all files in the parent directory, and if the names match,
        // then return it. If there are multiple files with the same name, but
        // different extensions, it will return the first one
        for (const f of files) {
            if (path_1.default.basename(p) === path_1.default.basename(f, path_1.default.extname(f))) {
                return path_1.default.join(prefix, f);
            }
        }
        return false;
    }
}();

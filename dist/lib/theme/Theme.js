"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const recursive_readdir_1 = __importDefault(require("recursive-readdir"));
const util_1 = require("util");
const lodash_1 = __importDefault(require("lodash"));
const Renderer = require('./Renderer');
const fsReadDir = util_1.promisify(fs_1.default.readdir);
const fsReadFile = util_1.promisify(fs_1.default.readFile);
const DEFAULT_THEME = 'snow';
const MODULE_PREFIX = 'origami-theme-';
module.exports = new class Theme {
    constructor() {
        this.config = {
            name: ''
        };
        this.load(DEFAULT_THEME);
    }
    // Path to the theme module folder from the root project
    get pathTheme() {
        return path_1.default.resolve(process.cwd(), 'node_modules', MODULE_PREFIX + this.config.name);
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
    templates(template) {
        return __awaiter(this, void 0, void 0, function* () {
            ;
            const transform = (f) => ({
                name: path_1.default.basename(f, path_1.default.extname(f)),
                type: path_1.default.extname(f).slice(1),
                template: ''
            });
            if (template) {
                const file = yield this._getFile(template.toLowerCase(), this.pathTemplates);
                if (!file)
                    throw new Error('general.errors.notFound');
                const parsed = path_1.default.parse(file);
                const config = `${parsed.dir}/${parsed.name}.json`;
                const returning = transform(file);
                returning.template = (yield fsReadFile(file)).toString();
                try {
                    returning.config = require(config);
                }
                catch (e) {
                    // No config file
                }
                return returning;
            }
            return (yield recursive_readdir_1.default(this.pathTemplates))
                .filter(f => path_1.default.extname(f) != '.json')
                .map(transform);
        });
    }
    routes() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield recursive_readdir_1.default(this.pathRoutes))
                .filter(f => path_1.default.extname(f) === '.js');
        });
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
    renderPage(p, data = {}) { return this._renderPage(p, data, this.pathPages); }
    renderTemplate(p, data = {}) { return this._renderPage(p, data, this.pathTemplates); }
    renderStyles(p) {
        return this._renderStyles(p);
    }
    _renderPage(p, data, prefix) {
        return __awaiter(this, void 0, void 0, function* () {
            const file = yield this._getFile(p, prefix);
            if (!file)
                return false;
            return Renderer.render(this.config.name, file, { page: data, site: {} });
        });
    }
    _renderStyles(p) {
        return __awaiter(this, void 0, void 0, function* () {
            const _p = p.split('.').slice(0, -1).join('.');
            const file = yield this._getFile(_p, this.pathStyles);
            if (!file)
                throw new Error('general.errors.notFound');
            return Renderer.render(this.config.name, file);
        });
    }
    // Lookup a theme page file url based on request url
    _getFile(url, prefix) {
        return __awaiter(this, void 0, void 0, function* () {
            let p = url;
            // Allow for index at / resources
            if (p.slice(-1) === '/')
                p += 'index';
            p = path_1.default.join(prefix, p);
            let files;
            try {
                const parent = path_1.default.dirname(p);
                files = (yield fsReadDir(parent))
                    .filter(f => path_1.default.extname(f) != '.json');
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
        });
    }
}();

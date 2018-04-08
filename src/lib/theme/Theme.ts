import {Origami} from 'origami-core-lib';

import fs from 'fs';
import path from 'path';
import readdir from 'recursive-readdir';
import {promisify} from 'util';
import _ from 'lodash';

import Renderer from './Renderer';
const fsReadDir = promisify(fs.readdir);
const fsReadFile = promisify(fs.readFile);

const DEFAULT_THEME = 'snow';
const MODULE_PREFIX = 'origami-theme-';


export interface TemplateFile {
    name: string;
    type: string;
    template: string;
    config?: object;
}


export default new class Theme {
    config: Origami.Theme.Config;

    constructor() {
        this.config = {
            name: ''
        };
        this.load(DEFAULT_THEME);
    }

    // Path to the theme module folder from the root project
    get pathTheme() {
        return path.resolve(
            process.cwd(),
            'node_modules',
            MODULE_PREFIX + this.config.name
        );
    }

    // Path to the pages folder relative to the theme module
    get pathPages(): string {
        return path.join(this.pathTheme, '/views/pages');
    }
    // Path to the templates folder relative to the theme module
    get pathTemplates(): string {
        return path.join(this.pathTheme, '/views/templates');
    }
    // Path to the styles folder relative to the theme module
    get pathStyles(): string {
        return path.join(this.pathTheme, '/styles');
    }
    // Path to the routes folder relative to the theme module
    get pathRoutes(): string {
        return path.join(this.pathTheme, '/routes');
    }

    // Retrieve a list of, or indivual templates from the theme folder
    async templates(template?: string) {

        const transform = (f: string): TemplateFile => ({
            name: path.basename(f, path.extname(f)),
            type: path.extname(f).slice(1),
            template: ''
        });

        if (template) {
            const file = await this._getFile(template.toLowerCase(), this.pathTemplates);
            if (!file) throw new Error('general.errors.notFound');
            const parsed = path.parse(file);
            const config = `${parsed.dir}/${parsed.name}.json`;
            const returning = transform(file);
            returning.template = (await fsReadFile(file)).toString();
            try {
                returning.config = require(config);
            } catch (e) {
                // No config file
            }

            return returning;
        }

        return (await readdir(this.pathTemplates))
            .filter(f => path.extname(f) !== '.json')
            .map(transform);
    }

    async routes(): Promise<string[]> {
        try {
            return (await readdir(this.pathRoutes))
                .filter(f => path.extname(f) === '.js');
        } catch (e) {
            return [];
        }
    }

    // Load the theme file and set it to the config
    load(theme: string) {
        this.config.name = theme;

        this.config = require(path.resolve(this.pathTheme, 'theme.json'));

        this.config.paths = _.mapValues(this.config.paths, v =>
            path.resolve(this.pathTheme, v)
        );
    }

    getPageTypeProperties(type: string) {
        try {
            return require(path.resolve(this.pathTemplates, `${type}.json`)).properties;
        } catch (e) {
            throw new Error(`Template '${type}' has no associated .json config file`);
        }
    }

    renderPage(p: string, data: object = {}) { return this._renderPage(p, data, this.pathPages); }
    renderTemplate(p: string, data: object = {}) { return this._renderPage(p, data, this.pathTemplates); }
    renderStyles(p: string) {
        return this._renderStyles(p);
    }

    private async _renderPage(p: string, data: object, prefix: string) {
        const file = await this._getFile(p, prefix);
        if (!file) return false;

        return Renderer.render(
            this.config.name,
            file,
            {page: data, site: {}}
        );
    }

    private async _renderStyles(p: string) {
        const _p = p.split('.').slice(0, -1).join('.');
        const file = await this._getFile(_p, this.pathStyles);

        if (!file) throw new Error('general.errors.notFound');

        return Renderer.render(this.config.name, file);
    }


    // Lookup a theme page file url based on request url
    private async _getFile(url: string, prefix: string): Promise<string | false> {
        let p = url;
        // Allow for index at / resources
        if (p.slice(-1) === '/') p += 'index';

        p = path.join(prefix, p);
        let files;

        try {
            const parent = path.dirname(p);
            files = (await fsReadDir(parent))
                // Remove all the page data definition json files
                .filter(f => path.extname(f) !== '.json');
        } catch (e) {
            // If the file cannot be resolved, return false
            return false;
        }


        // Loop over all files in the parent directory, and if the names match,
        // then return it. If there are multiple files with the same name, but
        // different extensions, it will return the first one
        for (const f of files) {
            if (path.basename(p) === path.basename(f, path.extname(f))) {
                return path.join(prefix, f);
            }
        }

        return false;
    }

}();

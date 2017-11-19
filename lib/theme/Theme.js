const fs = require('fs');
const path = require('path');
const readdir = require('recursive-readdir');
const {promisify} = require('util');
const _ = require('lodash');

const Renderer = require('./Renderer');
const fsReadDir = promisify(fs.readdir);
const fsReadFile = promisify(fs.readFile);

const DEFAULT_THEME = 'snow';

module.exports = new class Theme {
    constructor() {
        this.config = null;
        this.themeName = null;
        this.load(DEFAULT_THEME);
    }

    get pathTheme() {
        return path.resolve(
            process.cwd(),
            'node_modules',
            `origami-theme-${this.themeName}`
        );
    }

    get pathPages() {
        return path.join(this.pathTheme, '/views/pages');
    }
    get pathTemplates() {
        return path.join(this.pathTheme, '/views/templates');
    }
    get pathStyles() {
        return path.join(this.pathTheme, '/styles');
    }
    get pathRoutes() {
        return path.join(this.pathTheme, '/routes');
    }

    async templates(template) {
        const transform = f => ({
            name: path.basename(f, path.extname(f)),
            type: path.extname(f).slice(1)
        });

        if (template) {
            const file = await this._getFile(template.toLowerCase(), this.pathTemplates);
            const parsed = path.parse(file);
            const config = `${parsed.dir}/${parsed.name}.json`;
            const returning = transform(file);
            returning.template = (await fsReadFile(file)).toString();
            try {
                returning.config = require(config);
            } catch (e) {
                //
            }

            return returning;
        }

        return (await readdir(this.pathTemplates))
            .filter(f => path.extname(f) != '.json')
            .map(transform);
    }

    async routes() {
        return (await readdir(this.pathRoutes))
            .filter(f => path.extname(f) === '.js');
    }

    // Load the theme file and set it to the config
    load(theme) {
        this.themeName = theme;
        this.config = require(path.resolve(this.pathTheme, 'theme.json'));

        this.config.paths = _.mapValues(this.config.paths, v =>
            path.resolve(this.pathTheme, v)
        );
    }

    getPageTypeProperties(type) {
        try {
            return require(path.resolve(this.pathTemplates, `${type}.json`)).properties;
        } catch (e) {
            throw new Error(`Template '${type}' has no associated .json config file`);
        }
    }

    renderPage(p, data = {}) { return this._renderPage(p, data, this.pathPages); }
    renderTemplate(p, data = {}) { return this._renderPage(p, data, this.pathTemplates); }
    renderStyles(p) {
        return this._renderStyles(p);
    }

    async _renderPage(p, data, prefix) {
        const file = await this._getFile(p, prefix);
        if (!file) return false;

        return Renderer.render(
            this.themeName,
            file,
            {page: data, site: {}}
        );
    }

    async _renderStyles(p) {
        const _p = p.split('.').slice(0, -1).join('.');
        const file = await this._getFile(_p, this.pathStyles);

        if (!file) {
            throw new Error('general.errors.notFound');
        }

        return Renderer.render(this.themeName, file);
    }


    // Lookup a theme page file url based on request url
    async _getFile(url, prefix) {
        let p = url;
        // Allow for index at / resources
        if (p.slice(-1) === '/') p += 'index';

        p = path.join(prefix, p);
        let files;

        try {
            const parent = path.dirname(p);
            files = (await fsReadDir(parent))
                // Remove all the page data definition json files
                .filter(f => path.extname(f) != '.json');
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

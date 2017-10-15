const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const _ = require('lodash');
// Const readdir = promisify(require('recursive-readdir'));

const Renderer = require('./Renderer');
const fsReadDir = promisify(fs.readdir);

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

    // Load the theme file and set it to the config
    load(theme) {
        this.themeName = theme;
        this.config = require(path.resolve(this.pathTheme, 'theme.json'));

        this.config.paths = _.mapValues(this.config.paths, v =>
            path.resolve(this.pathTheme, v)
        );
    }


    renderPage(p, data = {}) { return this._renderPage(p, data, this.pathPages); }
    renderTemplate(p, data = {}) { return this._renderPage(p, data, this.pathTemplates); }
    async renderStyles(p) {
        return await this._renderStyles(p);
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
        let _p = p.split('.').slice(0, -1).join('.');
        const file = await this._getFile(_p, this.pathStyles);
        if (!file) return false;

        return Renderer.render(this.themeName, file);
    }


    // Lookup a theme page file url based on request url
    async _getFile(url, prefix) {
        let p = url;
        // Allow for index at / resources
        if (p.slice(-1) === '/') p += 'index';

        p = path.join(prefix, p);
        const parent = path.dirname(p);
        const files = await fsReadDir(parent);

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

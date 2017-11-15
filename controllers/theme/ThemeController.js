const express = require('express');
const path = require('path');
const {Router} = require('express');

const theme = require('../../lib/theme/Theme');


module.exports = class ThemeController {
    constructor(initialTheme) {
        this.router = new Router();
        // Serve project content
        this.router.use('/content', express.static(
            path.resolve(process.cwd(), 'content')
        ));
        // Serve project content
        this.router.use('/assets', express.static(
            path.resolve(process.cwd(), 'node_modules', `origami-theme-${theme.themeName}`, 'assets')
        ));
        // Render styles
        this.router.use('/css', this.middlewareRenderStyles.bind(this));
        // Render pages
        this.router.use(this.middlewareRenderPage.bind(this));

        // Load the initial theme
        if (initialTheme) {
            theme.load(initialTheme);
        }
    }

    // If the request is already handled, leave it, otherwise pass on to
    // rendering
    async middlewareRenderPage(req, res, next) {
        if (res.data || res.error || res.body) return next();

        try {
            // Try find a page in the db
            const model = await res.app.get('store').model('page');
            const [page] = await model.find({url: req.url});
            // If there is a page with a template, attempt to render it,
            if (page) res.body = await theme.renderTemplate(page.type.toLowerCase(), page);
            // Otherwise attempt to render the view as a page
            else res.body = await theme.renderPage(req.path);

            next();
        } catch (e) {
            next(e);
        }
    }

    async middlewareRenderStyles(req, res, next) {
        if (res.data || res.error || res.body) return next();

        try {
            (await theme.renderStyles(req.url))
                .on('error', next)
                .pipe(res);
        } catch (e) {
            next(e);
        }
    }

};

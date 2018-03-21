const express = require('express');
const path = require('path');
const {Route} = require('../../dist/Router');
const theme = require('../../lib/theme/Theme');


module.exports = class ThemeController {
    constructor(initialTheme) {
        this.route = new Route().position('render');
        this.initialTheme = initialTheme;
    }

    async setup() {
        // Load the initial theme
        if (this.initialTheme) theme.load(this.initialTheme);
        await this.middlwareRoutes();

        // Serve project content
        this.route.route('/content').use(express.static(
            path.resolve(process.cwd(), 'content')
        ));
        // Serve project content
        this.route.route('/assets').use(express.static(
            path.resolve(process.cwd(), 'node_modules', `origami-theme-${theme.themeName}`, 'assets')
        ));
        // Render styles
        this.route.route('/css').use(this.middlewareRenderStyles.bind(this));

        // Render pages
        this.route
            .route(/^((?!(\/assets\/|\/api\/)))/)
            .position('store')
            .use(this.middlewareGetPage.bind(this))
            .position('render')
            .use(this.middlewareRenderPage.bind(this));
    }

    // Allow for theme to setup route controllers
    async middlwareRoutes() {
        const routes = await theme.routes();
        routes.forEach(r => {
            const router = require(r);
            this.route.route(router);
        });
    }

    // If the request is already handled, leave it, otherwise pass on to
    // rendering
    async middlewareGetPage(req, res, next) {
        if (res.data || res.error || res.body) return next();

        // Try find a page in the db
        const model = await res.app.get('store').model('page');
        const [page] = await model.find({url: req.url});

        res.data = page;

        if (page) {
            res.isPage = true;
            res.pageType = page.type;
            res.data.children = await model.children(page.id, true);
        }
        next();
    }

    async middlewareRenderPage(req, res, next) {
        const page = res.data;

        // If there is not data for a page (ie: page not in store), then attempt
        // to render it as a theme page, not a theme template
        if (!page) {
            try {
                res.body = await theme.renderPage(req.path);
            } catch (e) {
                return next(e);
            }

            return next();
        }

        try {
            // If there is a page with a template, attempt to render it,
            if (page) res.body = await theme.renderTemplate(page.type.toLowerCase(), page);

            next();

        } catch (e) {
            const err = new Error('page.errors.render');
            err.stack = e.stack;
            next(err);
        }
    }

    async middlewareRenderStyles(req, res, next) {
        if (res.data || res.error || res.body) return next();

        res.type('css');

        try {
            (await theme.renderStyles(req.url))
                .on('error', next)
                .pipe(res);
        } catch (e) {
            next(e);
        }
    }

};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const Router_1 = require("../../Router");
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const Theme_1 = __importDefault(require("../../lib/theme/Theme"));
class ThemeController {
    constructor(initialTheme) {
        this.route = new Router_1.Route().position('render');
        this.initialTheme = initialTheme;
    }
    async setup() {
        // Load the initial theme
        if (this.initialTheme)
            Theme_1.default.load(this.initialTheme);
        await this.middlwareRoutes();
        // Serve project content
        this.route.route('/content').use(express_1.default.static(path_1.default.resolve(process.cwd(), 'content')));
        // Serve project content
        this.route.route('/assets').use(express_1.default.static(path_1.default.resolve(process.cwd(), 'node_modules', `origami-theme-${Theme_1.default.config.name}`, 'assets')));
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
        const routes = await Theme_1.default.routes();
        routes.forEach(r => {
            const router = require(r);
            this.route.route(router);
        });
    }
    // If the request is already handled, leave it, otherwise pass on to
    // rendering
    async middlewareGetPage(req, res, next) {
        if (res.data || res.error || res.body)
            return next();
        // Try find a page in the db
        const model = await res.app.get('store').model('page');
        const [page] = await model.find({ url: req.url });
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
                res.body = await Theme_1.default.renderPage(req.path);
            }
            catch (e) {
                return next(e);
            }
            return next();
        }
        try {
            // If there is a page with a template, attempt to render it,
            if (page)
                res.body = await Theme_1.default.renderTemplate(page.type.toLowerCase(), page);
            next();
        }
        catch (e) {
            const err = new Error('page.errors.render');
            err.stack = e.stack;
            next(err);
        }
    }
    async middlewareRenderStyles(req, res, next) {
        if (res.data || res.error || res.body)
            return next();
        res.type('css');
        try {
            (await Theme_1.default.renderStyles(req.url))
                .on('error', next)
                .pipe(res);
        }
        catch (e) {
            next(e);
        }
    }
}
exports.default = ThemeController;

import express from 'express';
import {Origami, Route} from 'origami-core-lib';
import path from 'path';
import theme, {TemplateFile} from '../../lib/theme/Theme';

export {Route} from 'origami-core-lib';


export default class ThemeController {
    route: Route;
    initialTheme: string;

    constructor(initialTheme: string) {
        this.route = new Route().position('render');
        this.initialTheme = initialTheme;
    }

    async setup() {
        // Load the initial theme
        if (this.initialTheme) theme.load(this.initialTheme);
        await this.middlewareRoutes();

        // Serve project content
        this.route.route('/content').use(express.static(
            path.resolve(process.cwd(), 'content')
        ));
        // Serve project content
        this.route.route('/assets').use(express.static(
            path.resolve(
                process.cwd(),
                'node_modules',
                `origami-theme-${theme.config.name}`,
                'assets'
            )
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
    async middlewareRoutes() {
        const routes = await theme.routes();
        routes.forEach(r => {
            const router = require(r);
            this.route.route(router);
        });
    }

    // If the request is already handled, leave it, otherwise pass on to
    // rendering
    async middlewareGetPage(
        req: Origami.Server.Request,
        res: Origami.Server.Response,
        next: Origami.Server.NextFunction
    ) {
        if (res.data || res.error || res.body) return next();

        // Try find a page in the db
        const model = await res.app.get('store').model('page');
        const [page] = await model.find({url: req.url});

        res.data = page;

        interface resData {
            children: TemplateFile[];
        }


        if (page) {
            res.isPage = true;
            res.pageType = page.type;
            (res.data as resData).children = await model.children(page.id, true);
        }
        next();
    }

    async middlewareRenderPage(
        req: Origami.Server.Request,
        res: Origami.Server.Response,
        next: Origami.Server.NextFunction
    ) {
        const page = res.data as TemplateFile;

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

    async middlewareRenderStyles(
        req: Origami.Server.Request,
        res: Origami.Server.Response,
        next: Origami.Server.NextFunction
    ) {
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

}

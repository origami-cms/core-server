import { Origami, Route } from 'origami-core-lib';
export { Route } from 'origami-core-lib';
export default class ThemeController {
    route: Route;
    initialTheme: string;
    constructor(initialTheme: string);
    setup(): Promise<void>;
    middlewareRoutes(): Promise<void>;
    middlewareGetPage(req: Origami.Server.Request, res: Origami.Server.Response, next: Origami.Server.NextFunction): Promise<void>;
    middlewareRenderPage(req: Origami.Server.Request, res: Origami.Server.Response, next: Origami.Server.NextFunction): Promise<void>;
    middlewareRenderStyles(req: Origami.Server.Request, res: Origami.Server.Response, next: Origami.Server.NextFunction): Promise<void>;
}

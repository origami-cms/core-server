"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const Router_1 = require("../../Router");
const auth_1 = require("../../lib/auth");
exports.default = async () => {
    const route = new Router_1.Route('/api/v1');
    // If the body has a password, hash it for all routes
    route
        .position('pre-store')
        .use(async (req, res, next) => {
        if (req.body.password) {
            req.__initialPassword = req.body.password;
            req.body.password = await auth_1.passwordHash(req.body.password);
        }
        next();
    });
    route.include(path_1.default.resolve(__dirname, './v1'), '/', true);
    route
        .position('pre-render')
        .use((req, res, next) => {
        if (!res.data && !res.body && !res.responseCode)
            res.responseCode = 'general.errors.notFound';
        next();
    });
    return route;
};

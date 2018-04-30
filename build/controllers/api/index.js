"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const { parse: raml2obj } = require('raml2obj');
const APIController_1 = __importDefault(require("./APIController"));
const Router_1 = require("../../Router");
const auth_1 = require("../../lib/auth");
const RAML_PATH = path_1.default.resolve(__dirname, '../../../raml/api.raml');
exports.default = async () => {
    const route = new Router_1.Route('/api/v1');
    const raml = await raml2obj(RAML_PATH);
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
    // @ts-ignore Ignore the parent object structure
    const parent = { route };
    if (raml.resources)
        raml.resources.forEach(res => new APIController_1.default(res, parent));
    return route;
};

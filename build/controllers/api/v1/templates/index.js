"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const Theme_1 = __importDefault(require("../../../../lib/theme/Theme"));
const Router_1 = require("../../../../Router");
const r = new Router_1.Route('/api/v1/templates');
module.exports = r;
r.get(async (req, res, next) => {
    res.data = await Theme_1.default.templates();
    next();
});

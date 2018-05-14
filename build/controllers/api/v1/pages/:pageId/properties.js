"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const Router_1 = require("../../../../../Router");
const Theme_1 = __importDefault(require("../../../../../lib/theme/Theme"));
const r = new Router_1.Route('/api/v1/pages/:pageId/properties');
module.exports = r;
r.get(async (req, res, next) => {
    try {
        const model = await res.app.get('store').model('page');
        const { type } = await model.find({ id: req.params.pageId });
        res.data = Theme_1.default.getPageTypeProperties(type);
        next();
    }
    catch (e) {
        next(e);
    }
});
r.put(async (req, res, next) => {
    const id = req.params.pageId;
    try {
        const model = await res.app.get('store').model('page');
        res.data = await model.update(id, { data: req.body });
        next();
    }
    catch (e) {
        next(e);
    }
});

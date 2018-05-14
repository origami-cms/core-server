"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Router_1 = require("../../../../../Router");
const r = new Router_1.Route('/api/v1/pages/tree/:pageId');
module.exports = r;
r.get(async (req, res, next) => {
    try {
        const model = await res.app.get('store').model('page');
        res.data = await model.children(req.params.pageId, ['url', 'title']);
        next();
    }
    catch (e) {
        next(e);
    }
});

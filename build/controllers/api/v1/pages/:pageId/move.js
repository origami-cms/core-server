"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Router_1 = require("../../../../../Router");
const r = new Router_1.Route('/api/v1/pages/:pageId/move');
module.exports = r;
r.post(async (req, res, next) => {
    try {
        const model = await res.app.get('store').model('page');
        res.data = await model.move(req.params.pageId, req.body.parent);
        next();
    }
    catch (e) {
        next(e);
    }
});

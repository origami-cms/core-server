"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Router_1 = require("../../../../../Router");
const r = new Router_1.Route('/api/v1/pages/tree');
module.exports = r;
r.get(async (req, res, next) => {
    const model = await res.app.get('store').model('page');
    const rootPages = await model.find({ parent: null });
    res.data = [];
    await Promise.all(rootPages.map(page => new Promise(async (_res) => {
        res.data.push({
            id: page.id,
            url: page.url,
            title: page.title,
            children: await model.children(page.id, ['url', 'title'])
        });
        _res();
    })));
    next();
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Router_1 = require("../../../../Router");
const lib_1 = require("../../../../lib");
const r = new Router_1.Route('/api/v1/themes');
module.exports = r;
r.get(async (req, res, next) => {
    res.data = (await lib_1.NPM.search('theme')).map(p => ({
        name: p.name,
        version: p.version,
        description: p.description,
        author: p.author
    }));
    next();
});

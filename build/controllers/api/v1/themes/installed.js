"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Router_1 = require("../../../../Router");
const lib_1 = require("../../../../lib");
const r = new Router_1.Route('/api/v1/themes/installed');
module.exports = r;
r.get(async (req, res, next) => {
    const t = await Promise.all([
        // Get list of packages
        lib_1.NPM.list('theme'),
        // TODO: Move to db call
        // Get activated package
        'snow'
    ]);
    let [themes] = t;
    const [, activated] = t;
    themes = themes
        .map(_t => {
        const r = /^origami-theme-(.+)$/.exec(_t);
        return r ? r[1] : null;
    })
        .filter(_t => _t);
    res.data = { themes, activated };
    next();
});

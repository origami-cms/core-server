"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Router_1 = require("../Router");
const path_1 = require("path");
exports.default = (app) => {
    const r = new Router_1.Route('/content/profiles/:userId');
    r.get(async (req, res, next) => {
        if (res.headersSent)
            return next();
        const m = res.app.get('store').model('user');
        const u = await m.find({ id: req.params.userId });
        if (!u) {
            return res.sendFile(path_1.resolve(__dirname, 'default.svg'));
        }
        res.data = u;
        return next();
    });
    app.useRouter(r);
};

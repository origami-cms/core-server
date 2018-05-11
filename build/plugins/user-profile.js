"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Router_1 = require("../Router");
exports.default = (app) => {
    const r = new Router_1.Route('/content/profiles/:userId');
    r.get(async (req, res, next) => {
        if (res.headersSent)
            return next();
        const m = res.app.get('store').model('user');
        const u = await m.find({ id: req.params.userId });
        res.data = u;
        return next();
    });
    app.useRouter(r);
};

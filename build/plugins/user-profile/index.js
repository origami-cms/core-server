"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const Router_1 = require("../../Router");
const md5_1 = __importDefault(require("md5"));
const path_1 = require("path");
const find_root_1 = __importDefault(require("find-root"));
const request_1 = __importDefault(require("request"));
const sendDefault = (res) => {
    return res.sendFile(path_1.resolve(find_root_1.default(__dirname), 'content/profile/default.svg'));
};
exports.default = (app) => {
    const r = new Router_1.Route('/content/profiles/:userId');
    r.get(async (req, res, next) => {
        if (res.headersSent)
            return next();
        const m = res.app.get('store').model('user');
        const u = await m.find({ id: req.params.userId });
        if (!u)
            return sendDefault(res);
        request_1.default(`https://www.gravatar.com/avatar/${md5_1.default(u.email)}.jpg?s=100`)
            .on('error', err => sendDefault(res))
            .pipe(res);
    });
    app.useRouter(r);
};

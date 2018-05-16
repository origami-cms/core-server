"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const Router_1 = require("../../../../Router");
const auth_1 = __importDefault(require("../../../../middleware/auth"));
const r = new Router_1.Route('/api/v1/users/me');
module.exports = r;
r
    .position('pre-store')
    .use(auth_1.default)
    .get(async (req, res, next) => {
    res.data = await res.app.get('store').model('user').find({
        id: req.jwt.data.userId
    });
    next();
});

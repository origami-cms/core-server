"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
}
Object.defineProperty(exports, "__esModule", { value: true });
const Router_1 = require("../../../../Router");
const auth = __importStar(require("../../../../lib/auth"));
const r = new Router_1.Route('/api/v1/users');
module.exports = r;
r.position('pre-store').post(async (req, res, next) => {
    req.body.password = await auth.passwordHash(req.body.password);
    next();
});

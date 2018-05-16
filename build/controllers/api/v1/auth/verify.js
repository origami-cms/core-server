"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
}
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const Router_1 = require("../../../../Router");
const auth = __importStar(require("../../../../lib/auth"));
const auth_1 = __importDefault(require("../../../../middleware/auth"));
const r = new Router_1.Route('/api/v1/auth/verify');
module.exports = r;
/*
* Validates the JWT token
* it's expiry.
*/
r
    .position('store')
    .use(auth_1.default)
    .get(async (req, res, next) => {
    const existing = auth.jwtVerify(req.jwt.token);
    res.responseCode = 'auth.success.verified';
    res.data = {
        valid: true
    };
    await next();
});

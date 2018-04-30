"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth = __importStar(require("../../../../../lib/auth"));
/*
 * Gives a new JWT based on the current one
 */
exports.post = () => async (req, res, next) => {
    const existing = auth.jwtVerify(req.jwt.token);
    delete existing.iat;
    delete existing.exp;
    const token = auth.jwtSign(existing);
    const { iat: expires } = auth.jwtVerify(token);
    res.data = { token, expires };
    await next();
};

"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth = __importStar(require("../lib/auth"));
exports.default = async (req, res, next) => {
    try {
        const head = req.headers.authorization;
        const _auth = head;
        if (!head)
            throw new Error('auth.errors.noHeader');
        const jwtRegex = /Bearer\s(.+)/;
        const regexResult = jwtRegex.exec(_auth);
        if (!regexResult)
            throw new Error('auth.errors.invalidHead');
        const [, jwt] = regexResult;
        let data;
        try {
            data = auth.jwtVerify(jwt);
        }
        catch (e) {
            if (e.name === 'JsonWebTokenError')
                throw new Error('auth.errors.invalidJWT');
            if (e.name === 'TokenExpiredError')
                throw new Error('auth.errors.expired');
            throw e;
        }
        req.jwt = {
            token: jwt,
            data
        };
        await next();
    }
    catch (e) {
        await next(e);
    }
};

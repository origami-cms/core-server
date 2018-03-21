"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth = require('../lib/auth');
exports.default = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
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
        yield next();
    }
    catch (e) {
        yield next(e);
    }
});

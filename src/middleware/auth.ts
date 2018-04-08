import {Request, Response, NextFunction} from 'express';
import {Origami} from 'origami-core-lib';

import * as auth from '../lib/auth';

export default async(req: Origami.Server.Request, res: Origami.Server.Response, next: NextFunction) => {
    console.log('got here');

    try {
        const head = req.headers.authorization;
        const _auth = head as string;

        if (!head) throw new Error('auth.errors.noHeader');
        const jwtRegex: RegExp = /Bearer\s(.+)/;
        const regexResult = jwtRegex.exec(_auth);
        if (!regexResult) throw new Error('auth.errors.invalidHead');
        const [, jwt] = regexResult;

        let data;
        try {
            data = auth.jwtVerify(jwt);
        } catch (e) {
            if (e.name === 'JsonWebTokenError') throw new Error('auth.errors.invalidJWT');
            if (e.name === 'TokenExpiredError') throw new Error('auth.errors.expired');
            throw e;
        }
        req.jwt = {
            token: jwt,
            data
        };

        await next();

    } catch (e) {
        await next(e);
    }
};
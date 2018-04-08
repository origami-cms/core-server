import {Origami} from 'origami-core-lib';
import * as auth from '../../../../../lib/auth';

/*
 * Gives a new JWT based on the current one
 */
export const post = (): Origami.Server.RequestHandler =>
    async(req, res, next) => {
        const existing = auth.jwtVerify(req.jwt.token);
        delete existing.iat;
        delete existing.exp;

        const token = auth.jwtSign(existing);
        const {iat: expires} = auth.jwtVerify(token);

        res.data = {token, expires};

        await next();
    };

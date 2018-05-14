import {Origami} from 'origami-core-lib';
import {Route} from '../../../../Router';
import * as auth from '../../../../lib/auth';

const r = new Route('/api/v1/auth/refresh');
module.exports = r;
/*
* Gives a new JWT based on the current one
*/
r.post(async(req, res, next) => {
    const existing = auth.jwtVerify(req.jwt.token);
    delete existing.iat;
    delete existing.exp;

    const token = auth.jwtSign(existing);
    const {iat: expires} = auth.jwtVerify(token);

    res.data = {token, expires};

    await next();
});

import {Route} from '../../../../Router';
import * as auth from '../../../../lib/auth';
import authMW from '../../../../middleware/auth';

const r = new Route('/api/v1/auth/verify');
module.exports = r;

/*
* Validates the JWT token
* it's expiry.
*/
r
    .position('store')
    .use(authMW)
    .get(async(req, res, next) => {
        const existing = auth.jwtVerify(req.jwt.token);

        res.responseCode = 'auth.success.verified';
        res.data = {
            valid: true
        };

        await next();
    });

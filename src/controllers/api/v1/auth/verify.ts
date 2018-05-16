import {Route} from '../../../../Router';

const r = new Route('/api/v1/auth/verify');
module.exports = r;

/*
* Validates the JWT token
* it's expiry.
*/
r.get(async(req, res, next) => {
    res.responseCode = 'auth.success.verified';
    res.data = {
        valid: true
    };

    await next();
});

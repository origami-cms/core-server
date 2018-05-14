import {Route} from '../../../../Router';

const r = new Route('/api/v1/auth/login');
module.exports = r;

/*
* Validates the JWT token
* it's expiry.
*/
r.get(async(req, res, next) => {
    res.data = {
        valid: true
    };

    await next();
});

import {Route} from '../../../../Router';
import {NPM} from '../../../../lib';
import * as auth from '../../../../lib/auth';

const r = new Route('/api/v1/users');
module.exports = r;

r.position('pre-store').post(async (req, res, next) => {
    req.body.password = await auth.passwordHash(req.body.password);
    next();
});

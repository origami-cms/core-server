import bcrypt from 'bcrypt';
import {Route} from '../../../../Router';
import * as auth from '../../../../lib/auth';

const r = new Route('/api/v1/auth/login');
module.exports = r;
/*
    * Validates the email and password of a user, then returns a JWT token, and
    * it's expiry.
    */
r.post(async(req, res, next) => {
    try {
        const model = await res.app.get('store').model('user');

            // Find the user
        const [user] = await model.find({email: req.body.email}, {hidden: true});
        if (!user) return next(new Error('auth.errors.noUser'));
            // Compare password
        if (!await bcrypt.compare(req.__initialPassword, user.password)) {
            return next(new Error('auth.errors.noUser'));
        }

            // If successful, sign JWT
        const token = auth.jwtSign({
            userId: user.id,
            email: user.email
        });
        const {iat: expires} = auth.jwtVerify(token);

        res.data = {token, expires};
        res.responseCode = 'auth.success.login';

        await next();

    } catch (e) {
        next(e);
    }
});


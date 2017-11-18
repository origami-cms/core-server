const bcrypt = require('bcrypt');
const auth = require('../../../../../lib/auth');

/*
 * Validates the email and password of a user, then returns a JWT token, and
 * it's expiry.
 */
module.exports.post = () =>
    async(req, res, next) => {
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
            await next();

        } catch (e) {
            next(e);
        }
    };

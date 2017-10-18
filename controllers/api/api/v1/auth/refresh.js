const bcrypt = require('bcrypt');
const auth = require('../../../../../lib/auth');

/*
 * Gives a new JWT based on the current one
 */
module.exports.post = () =>
    async(req, res, next) => {
        const existing = auth.jwtVerify(req.jwt);
        delete existing.iat;
        delete existing.exp;

        const token = auth.jwtSign(existing);
        const {iat: expires} = auth.jwtVerify(token);

        res.data = {token, expires};

        await next();
    };

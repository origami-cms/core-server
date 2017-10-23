const auth = require('../lib/auth');
module.exports = async(req, res, next) => {
    try {
        const head = req.headers.authorization;
        if (!head) throw new Error('auth.errors.noHeader');
        const jwtRegex = /Bearer\s(.+)/;
        if (!jwtRegex.test(head)) throw new Error('auth.errors.invalidHead');
        const [, jwt] = jwtRegex.exec(head);
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

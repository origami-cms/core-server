const auth = require('../../../../../lib/auth');

module.exports.post = controller => {
    return async(req, res, next) => {
        req.body.password = await auth.passwordHash(req.body.password);
        try {
            await controller.post(req, res);
            next();
        } catch (e) {
            next(e);
        }
    };
};

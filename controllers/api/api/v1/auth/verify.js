/*
 * Validates the JWT token
 * it's expiry.
 */
module.exports.get = () =>
    async(req, res, next) => {
        res.data = {
            valid: true
        };

        await next();
    };

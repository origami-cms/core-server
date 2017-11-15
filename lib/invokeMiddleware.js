/**
 * Programatically call express middleware functions
 * @param {Array} middlewares Array of Express middleware functions
 * @param {Request} req Request object
 * @param {Response} res Response object
 * @param {Function} next Next function
 */
module.exports = function invokeMiddleware(middlewares, req, res, next) {
    let i = 0;
    const run = () => {
        if (i < middlewares.length) {
            middlewares[i](req, res, err => {
                if (err) {
                    return next(err);
                }
                i += 1;
                run(i);
            });
        } else {
            next();
        }
    };
    run();
};

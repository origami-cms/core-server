const {error} = require('origami-core-lib');
const status = require('../lib/status');

module.exports = () =>
    async(err, req, res, next) => {
        const errCode = 500;
        if (err) {
            console.log(err);
            const message = status(res, err.message, errCode);
            if (!res.data && err.data) res.data = err.data;

            // If (res.statusCode === errCode) {
            if (process.env.NODE_ENV != 'production') {
                res.data = err.stack.split('\n');
            } else delete res.data;
            // }
            error('Server', new Error(`${req.method} ${req.url.yellow} ${message.red}`));
        }
        await next();
    };

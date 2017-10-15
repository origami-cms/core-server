require('colors');
const status = require('../lib/status');

module.exports = () =>
    async(err, req, res, next) => {
        const errCode = 500;
        if (err) {
            const message = status(res, err.message, errCode);
            if (!res.data && err.data) res.data = err.data;

            if (res.statusCode === errCode) {
                if (process.env.NODE_ENV != 'production') {
                    res.data = err.stack.split('\n');
                } else delete res.data;
            }

            console.log(`${new Date().toISOString().red} ❌`, req.method.yellow, req.url.yellow, message.red);
        }
        await next();
    };

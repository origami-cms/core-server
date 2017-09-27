const errors = require('origami-core-server-errors');
const query = require('json-query');
require('colors');

module.exports = () =>
    async(err, req, res, next) => {
        if (err) {
            const ln = errors(res.app.get('ln'));
            let message = query(err.message, {data: ln}).value;
            let code = 500;

            // Destructure the code and message from an array
            // EG: notFound: ['No resource found', 404]
            if (message instanceof Array) [message, code] = message;
            if (!message) message = 'Unknown error';

            res.status(code);
            res.text = message;
            console.log(`${new Date().toISOString().red} ❌`, req.url.yellow, message.red);
        }
        await next();
    };

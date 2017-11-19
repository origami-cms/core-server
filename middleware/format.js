const status = require('../lib/status');
const http = require('http-status-codes');

module.exports = () =>
    async(req, res, next) => {
        await next();

        if (res.responseCode) status(res, res.responseCode, http.OK);

        let body = res.body || res.text || res.data;


        // If it's a json request, wrap the data as json
        // NOTE: Attemtped req.is(), however there seemed to be a bug
        if (
            req.headers['content-type'] === 'application/json' ||
            req.path.indexOf('/api') == 0 ||
            res.data && !res.body
        ) {
            const returning = {
                statusCode: res.statusCode
            };

            if (res.text || res.data) {
                if (res.text) returning.message = res.text;
                if (res.data) returning.data = res.data;

            } else {
                res.status(http.NOT_FOUND);
                returning.statusCode = http.NOT_FOUND;
                returning.message = 'Not found';
            }

            return res.send(returning);

        } else if (!body) {
            res.status(http.NOT_FOUND).send('Not found');
        } else {
            const br = '<br />';
            // Show the error
            if (res.data) body += br + res.data;
            res.send(body);
        }
    };

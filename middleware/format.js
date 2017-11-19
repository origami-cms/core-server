const status = require('../lib/status');
const http = require('http-status-codes');

module.exports = () =>
    async(req, res, next) => {
        await next();

        if (res.responseCode) status(res, res.responseCode, http.OK);

        const body = res.body || res.text || res.data;

        // If it's a json request, wrap the data as json
        if (req.is('application/json')) {
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

        } else if (!body) res.send('Not found');
        else res.send(body);
    };

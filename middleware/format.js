const status = require('../lib/status');
const http = require('http-status-codes');

module.exports = () =>
    async(req, res, next) => {
        await next();

        const isAPI = req.path.indexOf('/api/') === 0;

        if (res.responseCode) status(res, res.responseCode, http.OK);

        if (res.text || res.data) {
            const returning = {
                statusCode: res.statusCode
            };
            if (res.text) returning.message = res.text;
            if (res.data) returning.data = res.data;

            return res.send(returning);


        } else if (isAPI) {
            return res.status(http.NOT_FOUND).send({
                statusCode: res.statusCode,
                message: 'Not found'
            });


        } else if (!res.body) {
            res.send('Not found');

        } else res.send(res.body);
    };

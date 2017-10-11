const status = require('../lib/status');

module.exports = () =>
    async(req, res, next) => {
        await next();

        const isAPI = req.path.indexOf('/api/') === 0;

        if (res.responseCode) status(res, res.responseCode, 200);

        if (res.text || res.data) {
            const returning = {
                statusCode: res.statusCode
            };
            if (res.text) returning.message = res.text;
            if (res.data) returning.data = res.data;

            return res.send(returning);


        } else if (isAPI) {
            return res.status(404).send({
                statusCode: res.statusCode,
                message: 'Not found'
            });


        } else if (!res.body) {
            res.send('Not found');

        } else res.send(res.body);
    };

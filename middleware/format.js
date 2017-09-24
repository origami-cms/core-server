module.exports = () =>
    async(req, res, next) => {
        await next();

        const isAPI = req.path.indexOf('/api/') === 0;

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


        } else {
            res.send('Not found');
        }
    };

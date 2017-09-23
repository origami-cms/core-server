module.exports = async(req, res, next) => {
    await next();
    if (res.text || res.data) {
        const returning = {
            statusCode: res.statusCode
        };
        if (res.text) returning.message = res.text;
        if (res.data) returning.data = res.data;

        return res.send(returning);
    }
};

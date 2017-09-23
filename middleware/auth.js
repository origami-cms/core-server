module.exports = async(req, res, next) => {
    try {
        if (!req.headers.authentication) throw new Error('auth.noHeader');
        await next();
    } catch (e) {
        await next(e);
    }
};

const theme = require('../../../../lib/theme/Theme');

module.exports.get = () =>
    async(req, res, next) => {
        res.data = await theme.templates();
        next();
    };

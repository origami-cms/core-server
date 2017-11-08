const theme = require('../../../../../lib/theme/Theme');

module.exports.get = () =>
    async(req, res, next) => {
        console.log('GETTING TEMPLATE', req.params.templateName);
        res.data = await theme.templates(req.params.templateName);
        next();
    };

const npm = require('../../../../lib/npm');

module.exports.get = () =>
    async(req, res, next) => {
        res.data = (await npm.search('theme')).map(p => ({
            name: p.name,
            version: p.version,
            description: p.description,
            author: p.author
        }));
        next();
    };

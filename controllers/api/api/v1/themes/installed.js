const path = require('path');
const npm = require('../../../../../lib/npm');

module.exports.get = () =>
    async(req, res, next) => {
        let [themes, activated] = await Promise.all([
            // Get list of packages
            npm.list('theme'),
            // TODO: Move to db call
            // Get activated package
            'snow'
        ]);

        themes = themes.map(t => (/^origami-theme-(.+)$/).exec(t)[1]);

        res.data = {themes, activated};
        next();
    };

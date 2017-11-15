const npm = require('../../../../../lib/npm');

module.exports.get = () =>
    async(req, res, next) => {
        const t = await Promise.all([
            // Get list of packages
            npm.list('theme'),
            // TODO: Move to db call
            // Get activated package
            'snow'
        ]);
        let [themes] = t;
        const [, activated] = t;

        themes = themes.map(_t => (/^origami-theme-(.+)$/).exec(_t)[1]);

        res.data = {themes, activated};
        next();
    };

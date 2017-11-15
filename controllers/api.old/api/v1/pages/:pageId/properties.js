const theme = require('../../../../../../lib/theme/Theme');

module.exports.get = () =>
    async(req, res, next) => {
        try {
            const model = await res.app.get('store').model('page');
            const {type} = await model.find({id: req.params.pageId});
            res.data = theme.getPageTypeProperties(type);

            next();
        } catch (e) {
            next(e);
        }
    };

module.exports.put = () =>
    async(req, res, next) => {
        const id = req.params.pageId;
        try {
            const model = await res.app.get('store').model('page');
            res.data = await model.update(id, {data: req.body});

            next();
        } catch (e) {
            next(e);
        }
    };

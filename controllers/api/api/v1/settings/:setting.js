const find = async(req, res) => {
    const model = await res.app.get('store').model('setting');
    const [setting] = await model.find({
        setting: req.params.setting
    });
    if (!setting) throw new Error('general.errors.notFound');
    else return {
        value: setting.value,
        model
    };
};

module.exports.get = () =>
    async(req, res, next) => {
        try {
            res.data = (await find(req, res)).value;
            next();
        } catch (e) {
            next(e);
        }
    };

module.exports.put = () =>
    async(req, res, next) => {
        try {
            const {model} = await find(req, res);
            model.update({setting: req.params.setting}, {value: req.body.value});
            next();
        } catch (e) {
            next(e);
        }
    };

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const find = async (req, res) => {
    const model = await res.app.get('store').model('setting');
    const [setting] = await model.find({
        setting: req.params.setting
    });
    if (!setting)
        throw new Error('general.errors.notFound');
    return {
        value: setting.value,
        model
    };
};
exports.get = () => async (req, res, next) => {
    try {
        res.data = (await find(req, res)).value;
        next();
    }
    catch (e) {
        next(e);
    }
};
exports.put = () => async (req, res, next) => {
    try {
        const { model } = await find(req, res);
        model.update({ setting: req.params.setting }, { value: req.body.value });
        next();
    }
    catch (e) {
        next(e);
    }
};

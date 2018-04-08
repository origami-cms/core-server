"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = () => async (req, res, next) => {
    try {
        const model = await res.app.get('store').model('setting');
        res.data = (await model.find())
            .reduce((settings, s) => {
            settings[s.setting] = s.value;
            return settings;
        }, {});
        next();
    }
    catch (e) {
        next(e);
    }
};
exports.post = () => async (req, res, next) => {
    try {
        const model = await res.app.get('store').model('setting');
        await model.create(req.body);
        next();
    }
    catch (e) {
        next(e);
    }
};

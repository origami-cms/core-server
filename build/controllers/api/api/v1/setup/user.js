"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Allows for a one time creation of a user if Origami is not setup, and the
// existing users length is 1 (the default origami bot)
exports.post = () => async (req, res, next) => {
    const store = await res.app.get('store');
    const modelConfig = store.model('origamiconfig');
    const modelUsers = store.model('user');
    const [setup] = await modelConfig.find({ setting: 'setup' });
    if (setup.value)
        return next(new Error('setup.errrors.initialUser'));
    const users = await modelUsers.find({});
    if (users.length > 1)
        return next(new Error('setup.errrors.initialUser'));
    res.data = await modelUsers.create(req.body);
    next();
};

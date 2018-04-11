"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Checks if the Origami instance has been setup
exports.get = () => async (req, res, next) => {
    const model = await res.app.get('store').model('origamiconfig');
    const setup = await model.find({ setting: 'setup' });
    res.data = { setup: false };
    if (setup.length)
        res.data.setup = setup[0].value;
    next();
};

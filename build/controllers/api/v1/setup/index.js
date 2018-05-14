"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Router_1 = require("../../../../Router");
const r = new Router_1.Route('/api/v1/setup');
module.exports = r;
// Checks if the Origami instance has been setup
r.get(async (req, res, next) => {
    const model = await res.app.get('store').model('origamiconfig');
    const setup = await model.find({ setting: 'setup' });
    res.data = { setup: false };
    if (setup.length)
        res.data.setup = setup[0].value;
    next();
});

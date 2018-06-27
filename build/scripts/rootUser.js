"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const origami_core_lib_1 = require("origami-core-lib");
/**
 * Creates the default origami user
 */
exports.default = async (app) => {
    const c = await origami_core_lib_1.config.read();
    if (!c)
        return origami_core_lib_1.error('Could not open config file');
    const store = await app.app.get('store');
    const modelUser = store.model('user');
    const existing = await modelUser.find({ email: 'bot@origamicms.com' });
    if (existing instanceof Array && existing.length) {
        if (existing.length === 1)
            return existing[0];
        return origami_core_lib_1.error('Cannot have more than one default user');
    }
    const user = {
        fname: 'origami',
        lname: 'cms',
        email: 'bot@origamicms.com',
        password: await origami_core_lib_1.auth.hash(c.store.password)
    };
    await modelUser.create(user);
};

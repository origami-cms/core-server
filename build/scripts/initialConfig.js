"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Creates the default origami user
 */
exports.default = async (app) => {
    const store = await app.app.get('store');
    if (!store)
        return;
    const model = store.model('setting');
    const existing = await model.find({ setting: 'setup' });
    if (!existing.length) {
        const con = await model.create({
            setting: 'setup',
            value: false
        });
    }
};

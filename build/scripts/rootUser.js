"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
}
Object.defineProperty(exports, "__esModule", { value: true });
const origami_core_lib_1 = require("origami-core-lib");
const auth = __importStar(require("../lib/auth"));
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
        password: await auth.passwordHash(c.store.password)
    };
    await modelUser.create(user);
};

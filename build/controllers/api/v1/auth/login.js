"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
}
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const Router_1 = require("../../../../Router");
const auth = __importStar(require("../../../../lib/auth"));
const r = new Router_1.Route('/api/v1/auth/login');
module.exports = r;
/*
    * Validates the email and password of a user, then returns a JWT token, and
    * it's expiry.
    */
r.post(async (req, res, next) => {
    try {
        const model = await res.app.get('store').model('user');
        console.log('getting user...');
        // Find the user
        const [user] = await model.find({ email: req.body.email }, { hidden: true });
        if (!user)
            return next(new Error('auth.errors.noUser'));
        // Compare password
        if (!await bcrypt_1.default.compare(req.__initialPassword, user.password)) {
            return next(new Error('auth.errors.noUser'));
        }
        // If successful, sign JWT
        const token = auth.jwtSign({
            userId: user.id,
            email: user.email
        });
        const { iat: expires } = auth.jwtVerify(token);
        console.log('got here');
        res.data = { token, expires };
        res.responseCode = 'auth.success.login';
        await next();
    }
    catch (e) {
        next(e);
    }
});

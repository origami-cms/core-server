"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth = __importStar(require("../../../../../lib/auth"));
/*
 * Validates the email and password of a user, then returns a JWT token, and
 * it's expiry.
 */
exports.post = () => async (req, res, next) => {
    try {
        const model = await res.app.get('store').model('user');
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
        res.data = { token, expires };
        await next();
    }
    catch (e) {
        next(e);
    }
};

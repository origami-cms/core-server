"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth = __importStar(require("../../../../../lib/auth"));
exports.post = (controller) => async (req, res, next) => {
    req.body.password = await auth.passwordHash(req.body.password);
    try {
        await controller.post(req, res);
        next();
    }
    catch (e) {
        next(e);
    }
};

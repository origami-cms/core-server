"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const origami_core_lib_1 = require("origami-core-lib");
const status_1 = __importDefault(require("../lib/status"));
exports.default = (async (err, req, res, next) => {
    const errCode = 500;
    if (err) {
        console.log(err);
        const message = status_1.default(res, err.message, errCode);
        if (!res.data && err.data)
            res.data = err.data;
        // If (res.statusCode === errCode) {
        if (process.env.NODE_ENV !== 'production' && err.stack) {
            res.data = err.stack.split('\n');
        }
        else
            delete res.data;
        // }
        origami_core_lib_1.error('Server', new Error(`${req.method} ${req.url.yellow} ${message.red}`));
    }
    await next();
});

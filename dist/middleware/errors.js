"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const { error } = require('origami-core-lib');
const status_1 = __importDefault(require("../lib/status"));
exports.default = () => (err, req, res, next) => __awaiter(this, void 0, void 0, function* () {
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
        error('Server', new Error(`${req.method} ${req.url.yellow} ${message.red}`));
    }
    yield next();
});

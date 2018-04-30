"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Options_1 = __importDefault(require("../Options"));
const SALT_ROUNDS = 10;
exports.passwordHash = (pass) => bcrypt_1.default.hash(pass, SALT_ROUNDS);
exports.passwordCompare = (pass, hash) => bcrypt_1.default.compare(pass, hash);
exports.jwtSign = (data) => jsonwebtoken_1.default.sign(data, Options_1.default.options.secret.toString(), {
    expiresIn: '30m'
});
exports.jwtVerify = (token) => jsonwebtoken_1.default.verify(token, Options_1.default.options.secret.toString());

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const rootUser_1 = __importDefault(require("./rootUser"));
const initialConfig_1 = __importDefault(require("./initialConfig"));
exports.default = async (app) => {
    await rootUser_1.default(app);
    await initialConfig_1.default(app);
};

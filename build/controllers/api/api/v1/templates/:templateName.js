"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Theme_1 = __importDefault(require("../../../../../lib/theme/Theme"));
exports.get = () => async (req, res, next) => {
    res.data = await Theme_1.default.templates(req.params.templateName);
    next();
};

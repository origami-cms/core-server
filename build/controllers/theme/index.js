"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ThemeController_1 = __importDefault(require("./ThemeController"));
exports.default = async (initialTheme) => {
    const ctrl = new ThemeController_1.default(initialTheme);
    await ctrl.setup();
    return ctrl.route;
};

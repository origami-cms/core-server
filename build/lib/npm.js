"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const npm = require('npm-programmatic');
const lodash_1 = __importDefault(require("lodash"));
const request_promise_native_1 = __importDefault(require("request-promise-native"));
/**
 * Get's a list of origami modules with a specific type
 * @param type Type of module to find
 */
exports.list = (type) => {
    let reg = null;
    if (type)
        reg = new RegExp(`origami-${type}`);
    let list = npm.list(process.cwd());
    list = list
        .filter(p => !lodash_1.default.endsWith(p, 'extraneous'))
        .map(p => {
        const res = (/^(.*)@.+$/).exec(p);
        return res ? res[1] : false;
    })
        .filter(p => p !== false);
    if (!reg)
        return list;
    return list.filter(p => reg.test(p));
};
// Searches api.npms.io
exports.search = async (type = '') => {
    let reg = null;
    if (type)
        reg = new RegExp(`origami-${type}`);
    const { results: list } = JSON.parse(await request_promise_native_1.default(`https://api.npms.io/v2/search?q=origami-${type}-`));
    const simple = list.map(p => p.package);
    if (!reg)
        return simple;
    return simple.filter((p) => reg.test(p.name));
};

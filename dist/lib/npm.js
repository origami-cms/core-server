"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const npm = require('npm-programmatic');
const _ = require('lodash');
const request = require('request-promise-native');
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
        .filter(p => !_.endsWith(p, 'extraneous'))
        .map(p => (/^(.*)@.+$/).exec(p)[1]);
    if (!reg)
        return list;
    if (reg)
        return list.filter(p => reg.test(p));
};
// Searches api.npms.io
module.exports.search = (type = '') => __awaiter(this, void 0, void 0, function* () {
    let reg = null;
    if (type)
        reg = new RegExp(`origami-${type}-`);
    let { results: list } = JSON.parse(yield request(`https://api.npms.io/v2/search?q=origami-${type}-`));
    list = list.map(p => p.package);
    if (reg)
        return list.filter(p => reg.test(p.name));
    return list;
});

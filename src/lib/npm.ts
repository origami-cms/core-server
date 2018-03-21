import {Origami} from '../types/global';

const npm = require('npm-programmatic');
const _ = require('lodash');
const request = require('request-promise-native');

/**
 * Get's a list of origami modules with a specific type
 * @param type Type of module to find
 */
export const list = (type: Origami.ModuleType) => {
    let reg: RegExp | null = null;
    if (type) reg = new RegExp(`origami-${type}`);

    let list: string[] = npm.list(process.cwd());
    list = list
        .filter(p => !_.endsWith(p, 'extraneous'))
        .map(p => (/^(.*)@.+$/).exec(p)[1]);

    if (!reg) return list;
    if (reg) return list.filter(p => reg.test(p));
};

// Searches api.npms.io
module.exports.search = async(type = '') => {
    let reg = null;
    if (type) reg = new RegExp(`origami-${type}-`);

    let {results: list} = JSON.parse(await request(`https://api.npms.io/v2/search?q=origami-${type}-`));
    list = list.map(p => p.package);

    if (reg) return list.filter(p => reg.test(p.name));
    return list;
};



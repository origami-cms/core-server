const npm = require('npm-programmatic');
const _ = require('lodash');
const request = require('request-promise-native');


module.exports.list = (type = '') => {
    let reg = null;
    if (type) reg = new RegExp(`origami-${type}`);

    const list = npm.list(process.cwd())
        .filter(p => !_.endsWith(p, 'extraneous'))
        .map(p => (/^(.*)@.+$/).exec(p)[1]);

    if (reg) return list.filter(p => reg.test(p));
    else return list;
};

// Searches api.npms.io
module.exports.search = async(type = '') => {
    let reg = null;
    if (type) reg = new RegExp(`origami-${type}-`);

    let {results: list} = JSON.parse(await request(`https://api.npms.io/v2/search?q=origami-${type}-`));
    list = list.map(p => p.package);

    if (reg) return list.filter(p => reg.test(p.name));
    else return list;
};



const npm = require('npm-programmatic');
const _ = require('lodash');

module.exports.list = (suffix = '') => {
    let reg = null;
    if (suffix) reg = new RegExp(`origami-${suffix}`);

    const list = npm.list(process.cwd())
        .filter(p => !_.endsWith(p, 'extraneous'))
        .map(p => (/^(.*)@.+$/).exec(p)[1]);

    if (reg) return list.filter(p => reg.test(p));
    else return list;
};

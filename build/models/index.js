"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
exports.default = (server) => {
    fs.readdirSync(__dirname)
        .filter(f => (/.*\.js$/).test(f))
        .filter(f => !(/index.js$/).test(f))
        .forEach(f => server.resource(f.split('.')[0], {
        model: require(`./${f}`),
        auth: true
    }));
};

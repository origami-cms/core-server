"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
exports.default = (store) => {
    fs.readdirSync(__dirname)
        .filter(f => (/.*\.js$/).test(f))
        .filter(f => !(/index.js$/).test(f))
        .forEach(f => store.model(f.split('.')[0], require(`./${f}`)));
};

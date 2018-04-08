"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../../../../lib");
exports.get = () => async (req, res, next) => {
    res.data = (await lib_1.NPM.search('theme')).map(p => ({
        name: p.name,
        version: p.version,
        description: p.description,
        author: p.author
    }));
    next();
};

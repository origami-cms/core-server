"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const osprey = require('osprey');
const RAML_PATH = path_1.default.resolve(__dirname, '../../raml/api.raml');
const OSPREY_CONFIG = {
    server: {
        notFoundHandler: false
    },
    disableErrorInterception: true
};
exports.default = async () => {
    let middleware;
    try {
        middleware = await osprey.loadFile(RAML_PATH, OSPREY_CONFIG);
    }
    catch (e) {
        console.log(e);
    }
    const fn = (req, res, next) => {
        middleware(req, res, async (err) => {
            console.log(err);
            if (err) {
                try {
                    res.data = err.requestErrors.map((e) => ({
                        type: e.type,
                        field: e.dataPath,
                        rule: e.keyword,
                        expected: e.schema
                    }));
                    await next(new Error('request.invalid'));
                }
                catch (e) {
                    next(err);
                }
            }
            else
                await next();
        });
    };
    return fn;
};

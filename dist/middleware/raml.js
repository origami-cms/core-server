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
const path = require('path');
const osprey = require('osprey');
const RAML_PATH = path.resolve(__dirname, '../../raml/api.raml');
const OSPREY_CONFIG = {
    'server': {
        'notFoundHandler': false
    },
    'disableErrorInterception': true
};
exports.default = () => __awaiter(this, void 0, void 0, function* () {
    let middleware;
    try {
        middleware = yield osprey.loadFile(RAML_PATH, OSPREY_CONFIG);
    }
    catch (e) {
        console.log(e);
    }
    return (req, res, next) => {
        middleware(req, res, (err) => __awaiter(this, void 0, void 0, function* () {
            if (err) {
                try {
                    res.data = err.requestErrors.map(e => ({
                        type: e.type,
                        field: e.dataPath,
                        rule: e.keyword,
                        expected: e.schema
                    }));
                    yield next(new Error('request.invalid'));
                }
                catch (e) {
                    next(err);
                }
            }
            else
                yield next();
        }));
    };
});

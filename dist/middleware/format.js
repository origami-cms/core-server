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
const status = require('../lib/status');
const http = require('http-status-codes');
exports.default = () => {
    return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        yield next();
        if (res.responseCode)
            status(res, res.responseCode, http.OK);
        let body = res.body || res.text || res.data;
        // If it's a json request, wrap the data as json
        // NOTE: Attemtped req.is(), however there seemed to be a bug
        if (req.headers['content-type'] === 'application/json' ||
            req.path.indexOf('/api') == 0 ||
            res.data && !res.body) {
            const returning = {
                statusCode: res.statusCode,
            };
            if (res.text || res.data) {
                if (res.text)
                    returning.message = res.text;
                if (res.data)
                    returning.data = res.data;
            }
            else {
                res.status(http.NOT_FOUND);
                returning.statusCode = http.NOT_FOUND;
                returning.message = 'Not found';
            }
            res.send(returning);
            return;
        }
        else if (!body) {
            res.status(http.NOT_FOUND);
            // If it's a page request, redirect
            if (typeof req.headers.accept != 'string')
                throw new Error('accept header should be a string');
            if (req.headers.accept.includes('text/html'))
                res.redirect('/404');
            else
                res.send();
        }
        else {
            if (res.statusCode != http.OK) {
                const br = '<br />';
                // Show the error
                if (res.data)
                    body += br + res.data;
            }
            res.send(body);
        }
    });
};

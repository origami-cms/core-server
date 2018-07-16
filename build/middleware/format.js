"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const status_1 = __importDefault(require("../lib/status"));
exports.default = () => {
    const fn = async (req, res, next) => {
        await next();
        if (res.responseCode)
            status_1.default(res, res.responseCode, http_status_codes_1.default.OK);
        let body = res.body || res.text || res.data;
        // If it's a json request, wrap the data as json
        // NOTE: Attempted req.is(), however there seemed to be a bug
        if (req.headers['content-type'] === 'application/json' ||
            req.path.indexOf('/api') === 0 ||
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
                res.status(http_status_codes_1.default.NOT_FOUND);
                returning.statusCode = http_status_codes_1.default.NOT_FOUND;
                returning.message = 'Not found';
            }
            res.send(returning);
            return;
        }
        if (!body) {
            res.status(http_status_codes_1.default.NOT_FOUND);
            // If it's a page request, redirect
            if (typeof req.headers.accept !== 'string') {
                throw new Error('accept header should be a string');
            }
            if (req.headers.accept.includes('text/html')) {
                if (req.url === '/404')
                    res.send('Not found');
                else
                    res.redirect('/404');
            }
            else
                res.send();
        }
        else {
            if (res.statusCode !== http_status_codes_1.default.OK) {
                const br = '<br />';
                // Show the error
                if (res.data)
                    body += br + res.data;
            }
            res.send(body);
        }
    };
    return fn;
};

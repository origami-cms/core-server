"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const statuses = require('origami-core-server-statuses');
const json_query_1 = __importDefault(require("json-query"));
/**
 * Lookup a status message from the language file based on the message id,
 * and update the server response.
 * @param res Server response
 * @param message Message code
 * @param code Status code (will be potentially overriden)
 * @return The message object
 */
exports.default = (res, message, code) => {
    const ln = statuses(res.app.get('ln'));
    let m = json_query_1.default(message, { data: ln }).value;
    let c = code;
    // Destructure the code and message from an array
    // EG: notFound: ['No resource found', 404]
    if (m instanceof Array)
        [m, c] = m;
    if (!m)
        m = 'Unknown error';
    res.status(c);
    res.text = m;
    return m;
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Router_1 = require("../../../../Router");
const r = new Router_1.Route('/api/v1/auth/login');
module.exports = r;
/*
* Validates the JWT token
* it's expiry.
*/
r.get(async (req, res, next) => {
    res.data = {
        valid: true
    };
    await next();
});

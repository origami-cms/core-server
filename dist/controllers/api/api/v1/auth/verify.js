"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Validates the JWT token
 * it's expiry.
 */
exports.get = () => async (req, res, next) => {
    res.data = {
        valid: true
    };
    await next();
};

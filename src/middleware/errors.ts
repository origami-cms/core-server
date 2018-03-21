import { Origami } from "../types/global";
import { NextFunction } from "express";

const {error} = require('origami-core-lib');
import status from '../lib/status';

export default () =>
    async(err: Origami.ServerError, req: Origami.ServerRequest, res: Origami.ServerResponse, next: NextFunction) => {
        const errCode = 500;
        if (err) {
            console.log(err);
            const message = status(res, err.message, errCode);
            if (!res.data && err.data) res.data = err.data;

            // If (res.statusCode === errCode) {
            if (process.env.NODE_ENV != 'production' && err.stack) {
                res.data = err.stack.split('\n');
            } else delete res.data;
            // }
            error('Server', new Error(`${req.method} ${req.url.yellow} ${message.red}`));
        }
        await next();
    };

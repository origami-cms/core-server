import {Origami, error} from 'origami-core-lib';
import {NextFunction, ErrorRequestHandler} from 'express';

import status from '../lib/status';

export default (async(err: Origami.Server.DataError, req: Origami.Server.Request, res: Origami.Server.Response, next: NextFunction) => {
    const errCode = 500;
    if (err) {
        console.log(err);
        const message = status(res, err.message, errCode);
        if (!res.data && err.data) res.data = err.data;

            // If (res.statusCode === errCode) {
        if (process.env.NODE_ENV !== 'production' && err.stack) {
            res.data = err.stack.split('\n');
        } else delete res.data;
            // }
        error('Server', new Error(`${req.method} ${req.url.yellow} ${message.red}`));
    }
    await next();
}) as ErrorRequestHandler;
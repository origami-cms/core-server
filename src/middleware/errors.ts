import 'colors';
import {ErrorRequestHandler, NextFunction} from 'express';
import {error, Origami} from 'origami-core-lib';
import status from '../lib/status';

export default (async(
    err: Origami.Server.DataError,
    req: Origami.Server.Request,
    res: Origami.Server.Response,
    next: NextFunction
) => {
    if (err) {
        const errCode = 500;
        let message = status(res, err.message, errCode);

        if (!res.data && err.data) res.data = err.data;

        // Is a CreateHttpError
        // @ts-ignore
        if (err.statusCode) {
            // @ts-ignore
            res.status(err.statusCode);
            res.text = message = err.message;
            console.log(err);
        }


        if (process.env.NODE_ENV !== 'production' && err.stack) {
            res.data = err.stack.split('\n');
        } else delete res.data;

        if (process.env.NODE_ENV !== 'production') error(err);
        error('Server', new Error(`${req.method} ${req.url.yellow} ${message.red}`));
    }
    await next();
}) as ErrorRequestHandler;

import {Origami} from 'origami-core-lib';
import {NextFunction, Response, RequestHandler} from 'express';

import status from '../lib/status';
import http from 'http-status-codes';

export default (): RequestHandler => {
    interface Returning {
        statusCode: number;
        data?: object;
        message?: string;
    }

    const fn = async(req: Origami.Server.Request, res: Origami.Server.Response, next: NextFunction) => {
        await next();
        if (res.responseCode) status(res, res.responseCode, http.OK);

        let body = res.body || res.text || res.data;

        // If it's a json request, wrap the data as json
        // NOTE: Attemtped req.is(), however there seemed to be a bug
        if (
            req.headers['content-type'] === 'application/json' ||
            req.path.indexOf('/api') === 0 ||
            res.data && !res.body
        ) {
            const returning: Returning = {
                statusCode: res.statusCode,
            };

            if (res.text || res.data) {
                if (res.text) returning.message = res.text;
                if (res.data) returning.data = res.data;

            } else {
                res.status(http.NOT_FOUND);
                returning.statusCode = http.NOT_FOUND;
                returning.message = 'Not found';
            }

            res.send(returning);
            return;

        }

        if (!body) {
            res.status(http.NOT_FOUND);
            // If it's a page request, redirect
            if (typeof req.headers.accept !== 'string') {
                throw new Error('accept header should be a string');
            }
            if (req.headers.accept.includes('text/html')) res.redirect('/404');
            // Otherwise send nothing
            else res.send();
        } else {
            if (res.statusCode !== http.OK) {
                const br = '<br />';
                // Show the error
                if (res.data) body += br + res.data;
            }
            res.send(body);
        }
    };


    return fn as RequestHandler;
};

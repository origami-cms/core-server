import {NextFunction, RequestHandler} from 'express';
import http from 'http-status-codes';
import {Origami, error} from 'origami-core-lib';
import status from '../lib/status';


export default (): RequestHandler => {
    interface Returning {
        statusCode: number;
        data?: object;
        message?: string;
    }

    const fn = async(
        req: Origami.Server.Request,
        res: Origami.Server.Response,
        next: NextFunction
    ) => {
        await next();

        if (res.headersSent) return;
        if (res.responseCode) status(res, res.responseCode, http.OK);

        let body = res.body || res.text || res.data;

        // If it's a json request, wrap the data as json
        // NOTE: Attempted req.is(), however there seemed to be a bug
        if (
            req.accepts('application/json') ||
            req.originalUrl.startsWith('/api') ||
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
                error('accept header should be a string');
            }
            if (req.headers.accept && req.headers.accept.includes('text/html')) {
                if (req.url !== '404') res.redirect('/404');
                // if (req.url === '/404') res.send('Not found');
            }
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

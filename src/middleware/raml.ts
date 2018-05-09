import {Handler, NextFunction, RequestHandler} from 'express';
import {Origami} from 'origami-core-lib';

import path from 'path';
const osprey = require('osprey');

const RAML_PATH = path.resolve(__dirname, '../../raml/api.raml');
const OSPREY_CONFIG = {
    server: {
        notFoundHandler: false
    },
    disableErrorInterception: true
};

interface OspreyRequestError {
    type: string;
    dataPath: string;
    keyword: string;
    schema: object;
}

export default async(): Promise<RequestHandler> => {
    let middleware: Handler;
    try {
        middleware = await osprey.loadFile(RAML_PATH, OSPREY_CONFIG);
    } catch (e) {
        console.log(e);
    }

    const fn = (req: Origami.Server.Request, res: Origami.Server.Response, next: NextFunction) => {
        middleware(req, res, async err => {
            if (err) {
                console.log(err);
                try {
                    res.data = err.requestErrors.map((e: OspreyRequestError)  => ({
                        type: e.type,
                        field: e.dataPath,
                        rule: e.keyword,
                        expected: e.schema
                    }));
                    await next(new Error('request.invalid'));
                } catch (e) {
                    next(err);
                }
            } else await next();
        });
    };

    return fn as RequestHandler;
};

import {Origami} from 'origami-core-lib';
/*
 * Validates the JWT token
 * it's expiry.
 */
export const get = (): Origami.Server.RequestHandler =>
    async(req, res, next) => {
        res.data = {
            valid: true
        };

        await next();
    };

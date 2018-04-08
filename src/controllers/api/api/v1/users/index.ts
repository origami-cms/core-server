import {Origami} from 'origami-core-lib';
import APIController from '../../../APIController';
import * as auth from '../../../../../lib/auth';

export const post = (controller: APIController): Origami.Server.RequestHandler =>
    async(req, res, next) => {
        req.body.password = await auth.passwordHash(req.body.password);
        try {
            await controller.post(req, res);
            next();
        } catch (e) {
            next(e);
        }
    };

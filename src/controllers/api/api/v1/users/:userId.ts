import {Origami} from 'origami-core-lib';
import APIController from '../../../APIController';

export const get = (
    controller: APIController
): Origami.Server.RequestHandler => async(req, res, next) => {
    if (req.params.userId === 'me') {
        res.data = await res.app.get('store').model('user').find({
            id: req.jwt.data.userId
        });
        next();
    } else {
        await controller.get(req, res, next);
    }
};

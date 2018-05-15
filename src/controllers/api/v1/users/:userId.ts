import {Origami} from 'origami-core-lib';
import {Resource} from '../../../../lib';

export const get = (
    controller: Resource
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

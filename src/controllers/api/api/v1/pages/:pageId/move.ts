import {Origami} from 'origami-core-lib';
export const post = (): Origami.Server.RequestHandler =>
    async(req, res, next) => {
        try {
            const model = await res.app.get('store').model('page');
            res.data = await model.move(req.params.pageId, req.body.parent);
            next();
        } catch (e) {
            next(e);
        }
    };

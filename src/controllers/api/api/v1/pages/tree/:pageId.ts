import {Origami} from 'origami-core-lib';
export const get = (): Origami.Server.RequestHandler =>
    async(req, res, next) => {
        try {
            const model = await res.app.get('store').model('page');
            res.data = await model.children(req.params.pageId, ['url', 'title']);
            next();
        } catch (e) {
            next(e);
        }
    };

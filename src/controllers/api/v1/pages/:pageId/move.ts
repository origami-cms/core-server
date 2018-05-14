import {Route} from '../../../../../Router';

const r = new Route('/api/v1/pages/:pageId/move');
module.exports = r;

r.post(async (req, res, next) => {
    try {
        const model = await res.app.get('store').model('page');
        res.data = await model.move(req.params.pageId, req.body.parent);
        next();
    } catch (e) {
        next(e);
    }
});

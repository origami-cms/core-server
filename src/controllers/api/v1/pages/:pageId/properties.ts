import {Route} from '../../../../../Router';
import theme from '../../../../../lib/theme/Theme';

const r = new Route('/api/v1/pages/:pageId/properties');
module.exports = r;

r.get(async (req, res, next) => {
    try {
        const model = await res.app.get('store').model('page');
        const {type} = await model.find({id: req.params.pageId});
        res.data = theme.getPageTypeProperties(type);

        next();
    } catch (e) {
        next(e);
    }
});

r.put(async (req, res, next) => {
    const id = req.params.pageId;
    try {
        const model = await res.app.get('store').model('page');
        res.data = await model.update(id, {data: req.body});

        next();
    } catch (e) {
        next(e);
    }
});

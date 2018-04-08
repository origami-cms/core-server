import {Origami} from 'origami-core-lib';
import theme from '../../../../../../lib/theme/Theme';

export const get = (): Origami.Server.RequestHandler =>
    async(req, res, next) => {
        try {
            const model = await res.app.get('store').model('page');
            const {type} = await model.find({id: req.params.pageId});
            res.data = theme.getPageTypeProperties(type);

            next();
        } catch (e) {
            next(e);
        }
    };

export const put = (): Origami.Server.RequestHandler =>
    async(req, res, next) => {
        const id = req.params.pageId;
        try {
            const model = await res.app.get('store').model('page');
            res.data = await model.update(id, {data: req.body});

            next();
        } catch (e) {
            next(e);
        }
    };

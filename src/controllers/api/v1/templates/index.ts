import {Origami} from 'origami-core-lib';
import theme from  '../../../../lib/theme/Theme';
import {Route} from '../../../../Router';

const r = new Route('/api/v1/templates');
module.exports = r;

r.get(async (req, res, next) => {
    res.data = await theme.templates();
    next();
});

import {Origami} from 'origami-core-lib';
import {Resource} from '../../../../lib';
import {Route} from '../../../../Router';
import auth from '../../../../middleware/auth';


const r = new Route('/api/v1/users/me');
module.exports = r;

r
    .position('pre-store')
    .use(auth)
    .get(async(req, res, next) => {
        res.data = await res.app.get('store').model('user').find({
            id: req.jwt.data.userId
        });
        next();
    });

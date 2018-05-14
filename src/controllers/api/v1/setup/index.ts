import {Origami} from 'origami-core-lib';
import {Route} from '../../../../Router';

const r = new Route('/api/v1/setup');
module.exports = r;

// Checks if the Origami instance has been setup
r.get(async (req, res, next) => {
    const model: Origami.Store.Model = await res.app.get('store').model('origamiconfig');
    const setup = await model.find({setting: 'setup'}) as {value: boolean}[];

    type S = { setup: boolean; };
    res.data = {setup: false};

    if (setup.length) (res.data as S).setup = setup[0].value;

    next();
});

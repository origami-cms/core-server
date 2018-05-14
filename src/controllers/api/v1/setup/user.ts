import {Origami} from 'origami-core-lib';
import {Route} from '../../../../Router';

const r = new Route('/api/v1/setup/user');
module.exports = r;

// Allows for a one time creation of a user if Origami is not setup, and the
// existing users length is 1 (the default origami bot)
r.post(async (req, res, next) => {
    const store = await res.app.get('store') as Origami.Store.Store;
    const modelConfig = store.model('origamiconfig') as Origami.Store.Model;
    const modelUsers = store.model('user') as Origami.Store.Model;

    const [setup] = await modelConfig.find({setting: 'setup'}) as {value: boolean }[];
    if (setup.value) return next(new Error('setup.errrors.initialUser'));

    const users = await modelUsers.find({}) as object[];
    if (users.length > 1) return next(new Error('setup.errrors.initialUser'));

    res.data = await modelUsers.create(req.body);

    next();
});

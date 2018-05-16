import {Origami} from 'origami-core-lib';
import {Route} from '../../../../Router';

const r = new Route('/api/v1/settings/:setting');
module.exports = r;

const find = async(req: Origami.Server.Request, res: Origami.Server.Response) => {
    const model = await res.app.get('store').model('setting');
    const [setting] = await model.find({
        setting: req.params.setting
    });
    if (!setting) throw new Error('general.errors.notFound');
    return {
        value: setting.value,
        model
    };
};

r.get(async (req, res, next) => {
    try {
        res.data = (await find(req, res)).value;
        next();
    } catch (e) {
        next(e);
    }
});

r.put(async (req, res, next) => {
    try {
        const {model} = await find(req, res);
        model.update({setting: req.params.setting}, {value: req.body.value});
        next();
    } catch (e) {
        next(e);
    }
});
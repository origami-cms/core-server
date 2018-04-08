import {Origami} from 'origami-core-lib';

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

export const get = (): Origami.Server.RequestHandler =>
    async(req, res, next) => {
        try {
            res.data = (await find(req, res)).value;
            next();
        } catch (e) {
            next(e);
        }
    };

export const put = (): Origami.Server.RequestHandler =>
    async(req, res, next) => {
        try {
            const {model} = await find(req, res);
            model.update({setting: req.params.setting}, {value: req.body.value});
            next();
        } catch (e) {
            next(e);
        }
    };

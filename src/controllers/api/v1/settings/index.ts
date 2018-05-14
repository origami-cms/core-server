import {Route} from '../../../../Router';

const r = new Route('/api/v1/settings');
module.exports = r;

r.get(async (req, res, next) => {
    try {
        const model = await res.app.get('store').model('setting');
        interface settings {
            [key: string]: any;
        }
        interface setting {
            setting: string;
            value: any;
        }

        res.data = (await model.find())
                .reduce(
                    (settings: settings, s: setting) => {
                        settings[s.setting] = s.value;

                        return settings;
                    },
                    {}
                );
        next();
    } catch (e) {
        next(e);
    }
});

r.post(async (req, res, next) => {
    try {
        const model = await res.app.get('store').model('setting');
        await model.create(req.body);
        next();
    } catch (e) {
        next(e);
    }
});

import {Origami} from 'origami-core-lib';
export const get = (): Origami.Server.RequestHandler =>
    async(req, res, next) => {
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
    };

export const post = (): Origami.Server.RequestHandler =>
    async(req, res, next) => {
        try {
            const model = await res.app.get('store').model('setting');
            await model.create(req.body);
            next();
        } catch (e) {
            next(e);
        }
    };

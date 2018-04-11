import {Origami} from 'origami-core-lib';

// Checks if the Origami instance has been setup
export const get = (): Origami.Server.RequestHandler =>
    async (req, res, next) => {
        const model: Origami.Store.Model = await res.app.get('store').model('origamiconfig');
        const setup = await model.find({setting: 'setup'}) as {value: boolean}[];

        type S = { setup: boolean; };
        res.data = {setup: false};

        if (setup.length) (res.data as S).setup = setup[0].value;

        next();
    };

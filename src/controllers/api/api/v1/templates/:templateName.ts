import {Origami} from 'origami-core-lib';
import theme from '../../../../../lib/theme/Theme';

export const get = (): Origami.Server.RequestHandler =>
    async(req, res, next) => {
        res.data = await theme.templates(req.params.templateName);
        next();
    };

import {Origami} from 'origami-core-lib';
import * as npm from '../../../../../lib/npm';

export const get = (): Origami.Server.RequestHandler =>
    async(req, res, next) => {
        const t = await Promise.all([
            // Get list of packages
            npm.list('theme'),
            // TODO: Move to db call
            // Get activated package
            'snow'
        ]);
        let [themes] = t;
        const [, activated] = t;

        themes = (themes as string[])
            .map(_t => {
                const r = /^origami-theme-(.+)$/.exec(_t);
                return r ? r[1] : null;
            })
            .filter(_t => _t) as string[];

        res.data = {themes, activated};
        next();
    } ;

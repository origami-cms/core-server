import {Route} from '../../../../Router';
import {NPM} from '../../../../lib';

const r = new Route('/api/v1/themes/installed');
module.exports = r;

r.get(async (req, res, next) => {
    const t = await Promise.all([
            // Get list of packages
        NPM.list('theme'),
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
});

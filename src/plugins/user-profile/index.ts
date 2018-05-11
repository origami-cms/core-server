import {Route} from '../../Router';
import Server from '../../server';
import {Origami} from 'origami-core-lib';
import md5 from 'md5';
import {resolve} from 'path';
import findRoot from 'find-root';
import request from 'request';

export default (app: Server) => {
    const r = new Route('/content/profiles/:userId');

    r.get(async(req, res, next) => {
        if (res.headersSent) return next();

        const m = res.app.get('store').model('user') as Origami.Store.Model;
        const u = await m.find({id: req.params.userId}) as Origami.Store.Resource;

        if (!u) return res.sendFile(resolve(findRoot(__dirname), 'content/profile/default.svg'));
        const {email} = u;

        request(`https://www.gravatar.com/avatar/${md5(email)}.jpg?s=100`).pipe(res);
    });

    app.useRouter(r);
};

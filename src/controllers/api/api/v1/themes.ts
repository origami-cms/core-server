import {Origami} from 'origami-core-lib';

import {NPM} from '../../../../lib';

export const get = (): Origami.Server.RequestHandler =>
    async(req, res, next) => {
        res.data = (await NPM.search('theme')).map(p => ({
            name: p.name,
            version: p.version,
            description: p.description,
            author: p.author
        }));
        next();
    };

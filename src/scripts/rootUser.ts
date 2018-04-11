import Server from '../server';
import {Origami, config, error} from 'origami-core-lib';
import * as auth from '../lib/auth';

/**
 * Creates the default origami user
 */
export default async(app: Server) => {
    const c = await config.read();
    if (!c) return error('Could not open config file');

    const store = await app.app.get('store') as Origami.Store.Store;
    const modelUser = store.model('user') as Origami.Store.Model;

    const existing = await modelUser.find({email: 'bot@origamicms.com'});
    if (existing instanceof Array && existing.length) {
        if (existing.length === 1) return existing[0];
        return error('Cannot have more than one default user');
    }

    const user = {
        fname: 'origami',
        lname: 'cms',
        email: 'bot@origamicms.com',
        password: await auth.passwordHash(c.store.password)
    };

    await modelUser.create(user);
};

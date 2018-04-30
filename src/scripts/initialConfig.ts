import Server from '../server';
import {Origami, config, error} from 'origami-core-lib';
import * as auth from '../lib/auth';

/**
 * Creates the default origami user
 */
export default async(app: Server) => {
    const store = await app.app.get('store') as Origami.Store.Store;
    const model = store.model('origamiconfig') as Origami.Store.Model;

    const existing = await model.find({setting: 'setup'}) as Origami.Store.Resource[];

    if (!existing.length) {
        const con = await model.create({
            setting: 'setup',
            value: false
        });
    }
};
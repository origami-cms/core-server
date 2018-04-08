import {Origami} from 'origami-core-lib';

const fs = require('fs');

export default (store: Origami.Store.Store) => {
    (fs.readdirSync(__dirname) as string[])
        .filter(f => (/.*\.js$/).test(f))
        .filter(f => !(/index.js$/).test(f))
        .forEach(f => store.model(
            f.split('.')[0],
            require(`./${f}`)
        ));
};

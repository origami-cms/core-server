import Server from '../server';

const fs = require('fs');

export default (server: Server) => {
    (fs.readdirSync(__dirname) as string[])
        .filter(f => (/.*\.js$/).test(f))
        .filter(f => !(/index.js$/).test(f))
        .forEach(f => server.resource(
            f.split('.')[0],
            {
                model: require(`./${f}`),
                auth: true
            }
        ));
};

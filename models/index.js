const fs = require('fs');

module.exports = store => {
    fs
        .readdirSync(__dirname)
        .filter(f => (/.*\.js$/).test(f))
        .filter(f => !(/index.js$/).test(f))
        .forEach(f => store.model(
            f.split('.')[0],
            require(`./${f}`)
        ));
};

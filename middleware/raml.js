const path = require('path');
const osprey = require('osprey');

const RAML_PATH = path.resolve(__dirname, '../raml/api.raml');
const OSPREY_CONFIG = {
    'server': {
        'notFoundHandler': false
    },
    'disableErrorInterception': true
};

module.exports = async() => {
    let middleware;
    try {
        middleware = await osprey.loadFile(RAML_PATH, OSPREY_CONFIG);
    } catch (e) {
        console.log(e);
    }

    return (req, res, next) => {
        middleware(req, res, async err => {
            if (err) {
                try {
                    res.data = err.requestErrors.map(e => ({
                        type: e.type,
                        field: e.dataPath,
                        rule: e.keyword,
                        expected: e.schema
                    }));
                    await next(new Error('request.invalid'));
                } catch (e) {
                    next(err);
                }
            } else await next();
        });
    };
};

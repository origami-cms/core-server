const invokeMiddleware = require('../lib/invokeMiddleware');
const url = require('url');

// Loops over positions and the queues, automatically firing all middlewares
// for a request.
module.exports = (positions, queues) =>
    async(req, res, next) => {
        const _url = url.parse(req.url).pathname;
        const method = req.method.toLowerCase();
        const mw = [];
        positions.forEach(p => {
            const routers = queues[p];
            routers.forEach(router => {
                router.stack
                    // Filter out the middleware
                    .filter(r => r.route)
                    .filter(r => r.regexp.test(_url))
                    .map(r => r.route)
                    .filter(r => r.methods[method])
                    .map(r => r.stack)
                    .forEach(stack => {
                        stack
                            .filter(layer => layer.method === method)
                            .forEach(layer => {
                                mw.push(layer.handle);
                            });
                    });
            });
        });

        if (mw.length) await invokeMiddleware(mw, req, res, next);
        else next();
    };

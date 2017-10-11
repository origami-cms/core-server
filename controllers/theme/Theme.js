const {Router} = require('express');

const theme = require('../../lib/theme/Theme');


module.exports = new class ThemeController {
    constructor() {
        this.router = new Router();
        this.router.use(
            this.middlewareExistingResponse.bind(this)
        );
    }

    // If the request is already handled, leave it, otherwise pass on to
    // rendering
    async middlewareExistingResponse(req, res, next) {
        if (res.data || res.error) return next();
        try {
            console.time('Time:Render'.cyan);
            res.body = await theme.render(req.path, require('./sampleData'));
            console.timeEnd('Time:Render'.cyan);
            next();
        } catch (e) {
            next(e);
        }
    }

}();

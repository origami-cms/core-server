"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.post = () => async (req, res, next) => {
    try {
        const model = await res.app.get('store').model('page');
        res.data = await model.move(req.params.pageId, req.body.parent);
        next();
    }
    catch (e) {
        next(e);
    }
};

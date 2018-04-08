"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = () => async (req, res, next) => {
    try {
        const model = await res.app.get('store').model('page');
        res.data = await model.children(req.params.pageId, ['url', 'title']);
        next();
    }
    catch (e) {
        next(e);
    }
};

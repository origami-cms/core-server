module.exports.get = controller => async(req, res, next) => {
    if (req.params.userId === 'me') {
        res.data = await res.app.get('store').model('user').find({
            id: req.jwt.data.userId
        });
        next();
    } else {
        controller.get(req, res, next);
    }
}

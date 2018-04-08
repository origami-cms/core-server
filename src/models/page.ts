module.exports = {
    name: 'user',
    properties: {
        id: 'uuid',
        title: {type: String, required: true},
        type: {type: String, required: false},
        url: {type: String, required: true},
        data: {type: Object}
    },
    tree: true
};

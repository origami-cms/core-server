module.exports = {
    'name': 'user',
    'properties': {
        id: 'uuid',
        name: {type: String, required: true, unique: true},
        version: {type: String, required: true},
        installed: {type: Boolean}
    }
};

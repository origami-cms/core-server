module.exports = {
    name: 'origamiconfig',
    properties: {
        id: 'uuid',
        setting: {type: String, required: true, unique: true},
        value: {type: [String, Object, Boolean, Number]}
    }
};

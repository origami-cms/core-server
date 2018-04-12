"use strict";
module.exports = {
    name: 'user',
    properties: {
        id: 'uuid',
        fname: { type: String, required: true },
        lname: { type: String, required: false },
        email: { type: 'email', required: false, unique: true },
        password: { type: String, required: true, hidden: true }
    }
};

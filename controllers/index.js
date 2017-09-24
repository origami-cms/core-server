const path = require('path');
const {parse: raml2obj} = require('raml2obj');
const express = require('express');
const Controller = require('./Controller');

const RAML_PATH = path.resolve(__dirname, '../raml/api.raml');

module.exports = async() => {
    const router = new express.Router();
    const raml = await raml2obj(RAML_PATH);

    const buildResources = (r, obj) => {
        obj.resources.forEach(res => {
            const c = new Controller(res);
            r.use(c.router);
        });
    };

    buildResources(router, raml);

    return router;
};

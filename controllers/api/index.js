const path = require('path');
const {parse: raml2obj} = require('raml2obj');
const express = require('express');
const Controller = require('./Controller');

const RAML_PATH = path.resolve(__dirname, '../../raml/api.raml');

module.exports = async() => {
    const router = new express.Router();
    const raml = await raml2obj(RAML_PATH);


    console.log('ℹ️ Origami.APIController: Routes'.magenta);
    raml.resources.forEach(res => {
        const c = new Controller(res);
        router.use(res.relativeUri, c.router);
    });

    router.use((req, res, next) => {
        if (!res.data) next(new Error('general.errors.notFound'));
        else next();
    });

    return router;
};

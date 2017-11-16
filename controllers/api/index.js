const path = require('path');
const {parse: raml2obj} = require('raml2obj');
const APIController = require('./APIController');
const {Route} = require('origami-cms');


const RAML_PATH = path.resolve(__dirname, '../../raml/api.raml');

module.exports = async() => {
    const route = new Route('/api/v1');
    const raml = await raml2obj(RAML_PATH);

    const parent = {route};
    raml.resources.forEach(res => new APIController(res, parent));

    route.use((req, res, next) => {
        if (!res.data) next(new Error('general.errors.notFound'));
        else next();
    });

    return route;
};

const path = require('path');
const {parse: raml2obj} = require('raml2obj');
const APIController = require('./APIController');
const {Route} = require('origami-cms');
const {passwordHash} = require('../../lib/auth');


const RAML_PATH = path.resolve(__dirname, '../../raml/api.raml');

module.exports = async() => {
    const route = new Route('/api/v1');
    const raml = await raml2obj(RAML_PATH);

    // If the body has a password, hash it for all routes
    route
        .position('pre-store')
        .use(async(req, res, next) => {
            if (req.body.password) {
                req.__initialPassword = req.body.password;
                req.body.password = await passwordHash(req.body.password);
            }
            next();
        });

    const parent = {route};
    if (raml.resources) raml.resources.forEach(res => new APIController(res, parent));


    return route;
};

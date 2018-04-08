import path from 'path';
const {parse: raml2obj} = require('raml2obj');
import APIController from './APIController';
import {Route} from '../../Router';
import {passwordHash} from '../../lib/auth';
import RAML from '../../types/RAML';


const RAML_PATH = path.resolve(__dirname, '../../../raml/api.raml');

export default async() => {
    const route = new Route('/api/v1');
    const raml: RAML = await raml2obj(RAML_PATH);

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

    // @ts-ignore Ignore the parent object structure
    const parent: APIController = {route};
    if (raml.resources) raml.resources.forEach(res => new APIController(res, parent));


    return route;
};

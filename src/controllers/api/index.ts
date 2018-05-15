import path from 'path';
import {Route} from '../../Router';
import {passwordHash} from '../../lib/auth';


export default async() => {
    const route = new Route('/api/v1');

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

    route.include(path.resolve(__dirname, './v1'), '/', true);


    return route;
};

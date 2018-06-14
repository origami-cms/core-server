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

    await route.include(path.resolve(__dirname, './v1'), '/', true);


    route
        .position('pre-render')
        .use((req, res, next) => {
            if (!res.data && !res.body && !res.responseCode && !res.text) res.responseCode = 'general.errors.notFound';
            next();
        });


    return route;
};

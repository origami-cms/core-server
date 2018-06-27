import ThemeController from './ThemeController';
import {Route} from 'origami-core-lib';


export default async (initialTheme: string) => {
    const ctrl = new ThemeController(initialTheme);
    await ctrl.setup();

    return ctrl.route;
};

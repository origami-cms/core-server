import ThemeController from './ThemeController';
import {Route} from '../../Router';


export default async (initialTheme: string) => {
    const ctrl = new ThemeController(initialTheme);
    await ctrl.setup();

    return ctrl.route;
};

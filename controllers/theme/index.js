const ThemeController = require('./ThemeController');

module.exports = async initialTheme => {
    const ctrl = new ThemeController(initialTheme);
    await ctrl.setup();

    return ctrl.route;
};

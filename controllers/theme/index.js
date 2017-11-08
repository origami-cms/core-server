const ThemeController = require('./ThemeController');

module.exports = initialTheme => new ThemeController(initialTheme).router;

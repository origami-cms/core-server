const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const engines = require('./engines');

const fsRead = promisify(fs.readFile);

module.exports = new class Renderer {
    render(theme, fileOrEngine, data) {
        return this.getFunction(
            this.getEngine(fileOrEngine, theme),
            theme
        )(fileOrEngine, data);
    }

    // Get the engine based off the name or filepath
    getEngine(fileOrEngine, themeName) {
        const name = fileOrEngine.includes('/')
            // Find the name based on extension
            ? path.extname(fileOrEngine).slice(1)
            // Otherwise fileOrEngine is just the engine...
            : fileOrEngine;

        const engine = engines[name];
        // if (!engine) throw new Error(`Origami.Theme: Rendering engine '${name}' is not supported`);
        try {
            return {
                name,
                engine: engine ? require(path.resolve(process.cwd(), 'node_modules', engine)) : false
            };
        } catch (e) {
            throw new Error(`Origami.Theme: Theme '${themeName}' requires '${engine}' to be installed`);
        }
    }


    // Based on the engine name, get the exact rendering method
    getFunction({name, engine}, theme) {
        switch (name) {
            case 'pug':
                return async(template, data) => {
                    const options = {
                        filename: template,
                        basedir: path.resolve(process.cwd(), 'node_modules', theme, 'views')
                    };

                    return engine.compile(
                        (await fsRead(template)).toString(),
                        options
                    )(data);
                };
            case 'hbs':
            case 'ejs':
                return async(template, data) => engine.compile(
                    (await fsRead(template)).toString()
                )(data);


            case 'scss':
            case 'sass':
                return styles => fs.createReadStream(styles).pipe(engine(styles));

            case false:
            default:
                return styles => fs.createReadStream(styles);
                // throw new Error(`Could not render with extension ${name}`);
        }
    }

}();

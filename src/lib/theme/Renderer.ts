import fs from 'fs';
import path from 'path';
import {promisify} from 'util';
import engines from './engines.js';
import * as pug from 'pug';

const fsRead = promisify(fs.readFile);

export interface Engine {
    name: string | false;
    engine: any;
}

export default new class Renderer {
    render(theme: string, fileOrEngine: string, data: object = {}) {
        return this.getFunction(
            this.getEngine(fileOrEngine, theme),
            theme
        )(fileOrEngine, data);
    }

    // Get the engine based off the name or filepath
    getEngine(fileOrEngine: string, themeName: string): Engine {
        const name = fileOrEngine.includes('/')
            // Find the name based on extension
            ? path.extname(fileOrEngine).slice(1)
            // Otherwise fileOrEngine is just the engine...
            : fileOrEngine;

        const engine = engines[name];
        try {
            return {
                name,
                engine: engine
                    ? require(path.resolve(process.cwd(), 'node_modules', engine))
                    : false
            };
        } catch (e) {
            throw new Error(
                `Origami.Theme: Theme '${themeName}' requires '${engine}' to be installed`
            );
        }
    }


    // Based on the engine name, get the exact rendering method
    getFunction({name, engine}: Engine, theme: string): Function {
        switch (name) {
            case 'pug':
                return async(template: string, data: pug.LocalsObject): Promise<string> => {
                    const markdown = require('marked');
                    markdown.setOptions({
                        breaks: true,
                        gfm: true
                    });

                    const options: pug.Options = {
                        filename: template,
                        basedir: path.resolve(process.cwd(), 'node_modules', theme, 'views'),
                        filters: {markdown}
                    };

                    return engine.compile(
                        (await fsRead(template)).toString(),
                        options
                    )(data);
                };

            case 'hbs':
            case 'ejs':
                return async(template: string, data: object) => engine.compile(
                    (await fsRead(template)).toString()
                )(data);


            case 'scss':
            case 'sass':
                return (styles: string) => fs.createReadStream(styles).pipe(engine(styles));

            case false:
            default:
                return (text: string) => fs.createReadStream(text);
                // Throw new Error(`Could not render with extension ${name}`);
        }
    }

}();

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const engines = require('./engines');
const fsRead = util_1.promisify(fs_1.default.readFile);
exports.default = new class Renderer {
    render(theme, fileOrEngine, data) {
        return this.getFunction(this.getEngine(fileOrEngine, theme), theme)(fileOrEngine, data);
    }
    // Get the engine based off the name or filepath
    getEngine(fileOrEngine, themeName) {
        const name = fileOrEngine.includes('/')
            // Find the name based on extension
            ? path_1.default.extname(fileOrEngine).slice(1)
            // Otherwise fileOrEngine is just the engine...
            : fileOrEngine;
        const engine = engines[name];
        // If (!engine) throw new Error(`Origami.Theme: Rendering engine '${name}' is not supported`);
        try {
            return {
                name,
                engine: engine ? require(path_1.default.resolve(process.cwd(), 'node_modules', engine)) : false
            };
        }
        catch (e) {
            throw new Error(`Origami.Theme: Theme '${themeName}' requires '${engine}' to be installed`);
        }
    }
    // Based on the engine name, get the exact rendering method
    getFunction({ name, engine }, theme) {
        switch (name) {
            case 'pug':
                return (template, data) => __awaiter(this, void 0, void 0, function* () {
                    const markdown = require('marked');
                    markdown.setOptions({
                        breaks: true,
                        gfm: true
                    });
                    const options = {
                        filename: template,
                        basedir: path_1.default.resolve(process.cwd(), 'node_modules', theme, 'views'),
                        filters: { markdown }
                    };
                    return engine.compile((yield fsRead(template)).toString(), options)(data);
                });
            case 'hbs':
            case 'ejs':
                return (template, data) => __awaiter(this, void 0, void 0, function* () {
                    return engine.compile((yield fsRead(template)).toString())(data);
                });
            case 'scss':
            case 'sass':
                return (styles) => fs_1.default.createReadStream(styles).pipe(engine(styles));
            case false:
            default:
                return (text) => fs_1.default.createReadStream(text);
        }
    }
}();

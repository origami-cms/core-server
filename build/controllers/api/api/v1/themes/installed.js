"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const npm = __importStar(require("../../../../../lib/npm"));
exports.get = () => async (req, res, next) => {
    const t = await Promise.all([
        // Get list of packages
        npm.list('theme'),
        // TODO: Move to db call
        // Get activated package
        'snow'
    ]);
    let [themes] = t;
    const [, activated] = t;
    themes = themes
        .map(_t => {
        const r = /^origami-theme-(.+)$/.exec(_t);
        return r ? r[1] : null;
    })
        .filter(_t => _t);
    res.data = { themes, activated };
    next();
};

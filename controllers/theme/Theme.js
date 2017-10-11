const fs = require('fs');
const path = require('path');
const util = require('util');
const _ = require('lodash');
const {Router} = require('express');

module.exports = new class Theme {
    constructor() {
        this.config = {};
        this.themeName = 'snow';
        this.load();
        this.router = new Router();
        this.router.use(
            this.middlewareExistingResponse.bind(this)
        );
    }

    get themePath() {
        return path.resolve(
            process.cwd(),
            'node_modules',
            `origami-theme-${this.themeName}`
        );
    }

    load() {
        this.config = require(path.resolve(this.themePath, 'theme.json'));

        this.config.paths = _.mapValues(this.config.paths, v =>
            path.resolve(this.themePath, v)
        );
    }

    middlewareExistingResponse(req, res, next) {
        if (res.data || res.error) return next();
        else this.middleware(...arguments);
    }
    middleware(req, res, next) {
        res.body = 'AWESOME!';
        next();
    }
}();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Options = require('../Options');

const SALT_ROUNDS = 10;

module.exports.passwordHash = pass => bcrypt.hash(pass, SALT_ROUNDS);
module.exports.passwordCompare = (pass, hash) => bcrypt.compare(pass, hash);

module.exports.jwtSign = data =>
    jwt.sign(
        data,
        Options.options.secret.toString(),
        {
            expiresIn: '30m'
        }
    );

module.exports.jwtVerify = token =>
    jwt.verify(
        token,
        Options.options.secret.toString()
    );

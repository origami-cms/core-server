const statuses = require('origami-core-server-statuses');
const query = require('json-query');

module.exports = (res, message, code) => {
    const ln = statuses(res.app.get('ln'));
    let m = query(message, {data: ln}).value;
    let c = code;

    // Destructure the code and message from an array
    // EG: notFound: ['No resource found', 404]
    if (m instanceof Array) [m, c] = m;
    if (!m) m = 'Unknown error';

    res.status(c);
    res.text = m;

    return m;
};

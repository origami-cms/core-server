import { Origami } from "../types/global";

const statuses = require('origami-core-server-statuses');
const query = require('json-query');

/**
 * Lookup a status message from the language file based on the message id,
 * and update the server response.
 * @param res Server response
 * @param message Message code
 * @param code Status code (will be potentially overriden)
 * @return The message object
 */
export default (res: Origami.ServerResponse, message: string, code: number): string => {
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

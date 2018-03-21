const CODE_OK = 200;

// Retrieve the example json body from the raml
const getResponse = (raml, method, code = CODE_OK) => {
    if (!raml.methods) return false;
    const res = raml.methods.find(m => m.method === method.toLowerCase());
    if (!res) return false;
    if (!res.responses) return false;
    const body = res.responses.find(r => r.code == code);
    if (!body) return false;
    if (body.body[0].typePropertyKind != 'JSON') return;

    return JSON.parse(body.body[0].type).data;
};


export default = raml => (req, res, next) => {
    if (!res.data) return next();
    const response = getResponse(raml, req.method, res.statusCode);
    if (response) {
        const validFields = Object.keys(response);
        Object.keys(res.data).forEach(k => {
            if (!validFields.includes(k)) delete res.data[k];
        });
    }
    next();
};

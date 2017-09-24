// Converts array of strings into object of symbols
module.exports.symbols = arr =>
    arr.reduce((o, i) => {
        o[i] = Symbol(o);

        return o;
    }, {});


module.exports.requireKeys = (arr, obj) => {
    arr.forEach(i => {
        if (!Object.keys(obj).includes(i)) {
            const e = new Error(`Missing key ${i}`);
            e.key = i;
            throw e;
        }
    });
};

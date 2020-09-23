
module.exports ={
    // https://stackoverflow.com/a/2970667
    camelize: function(str) {
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
            return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
        }).replace(/\s+/g, '');
    },
    
    enumToString: function (e, v) {
        return (Object.keys(e).filter(k => e[k] === v)[0] || '').toLowerCase();
    },

    removeSpaces: function (s) {
        return s
            .replace(/[\s]{2,}/g, ' ')
            .replace(/([\(\[\{])[\s]+/g, '$1')
            .replace(/[\s]+([\)\]\}])/g, '$1')
            .trim();
    }
}
export var log = function log(...m) {
    console.log('\n' + Date().toString() + ':\n', m);
}, err = function err(...m) {
    console.error('\n' + Date().toString() + ':\n', m);
};
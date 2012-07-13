var DataWrapper = function () {

    var config = {};
    config.endpoint = {
        http: 'http://static.bufferapp.com/images/extensions/',
        https: 'https://d389zggrogs7qo.cloudfront.net/images/extensions/'
    };
    
    return {
        get: function (file) {
            file = file.replace(/data\/shared\//, '');
            return (document.location.protocol === 'http:' ? config.endpoint.http : config.endpoint.https) + file;
        }
    };
    
};

if(!xt) var xt = {};
xt.data = DataWrapper();

xt.options = {"buffer.op":"true","buffer.op.facebook":"facebook","buffer.op.hacker":"true","buffer.op.key-combo":"alt+b","buffer.op.key-enable":"key-enable","buffer.op.reader":"reader","buffer.op.reddit":"reddit","buffer.op.twitter":"twitter","buffer.run":"true"};
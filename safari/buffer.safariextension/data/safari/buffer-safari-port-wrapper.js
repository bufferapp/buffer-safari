// Make the (really) stupid Safari ports act like Firefox ones
// Safari 'ports' are actually 'proxy' objects,
// and the API changes subtly depending
// whether this is loaded in to CS or global html.
var PortWrapper = function (port, name) {
    
    var contentScript = false;
    if( port.tab ) contentScript = true;
    
    return {
        on: function (type, cb) {
            //console.log(name, "listening for", type);
            return port.addEventListener("message", function (ev) {
                if( ev.name == type ) cb(ev.message);
            }, false);
        },
        off: function (type) {
            port.removeEventListener(type);
        },
        emit: function(type, payload) {
            //console.log(name, "dispatching ", type, payload);
            if( contentScript ) port.tab.dispatchMessage(type, payload);
            else port.page.dispatchMessage(type, payload);
        },
        destroy: function () {
            port = null;
        },
        name: port.name,
        raw: port
    };
    
};

if( !xt ) var xt = {};
xt.port = {
    on: function () {console.log("port.on called before initialised.", arguments)},
    emit: function () {console.log("port.emit called before initialised.", arguments)}
};
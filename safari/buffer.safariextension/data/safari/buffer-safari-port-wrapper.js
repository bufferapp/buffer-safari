/**
 * PortWrapper - a wrapper to make Safari messages & proxies behave more like
 * Firefox ports. The Safari API changes slightly depending on whether this
 * is loaded in a contentScript or not.
 *
 * port is either a safari tab object or the global safari.self object in
 * content scripts
 */
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
    off: function (type, cb) {
      // NOTE - this does not work
      port.removeEventListener(type, cb);
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
  off: function () {console.log("port.off called before initialised.", arguments)},
  emit: function () {console.log("port.emit called before initialised.", arguments)}
};

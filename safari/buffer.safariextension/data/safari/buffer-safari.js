/* global safari, bufferData, PortWrapper */

$(function() {

    xt.port.emit('buffer_options');
    xt.port.on('buffer_options', function(options) {
        if (!xt.options) xt.options = options;
    });

    var overlayPort = PortWrapper(safari.self, "overlay");
    overlayPort.on("buffer_click", function(postData) {
        bufferData(overlayPort, postData);
    });

    // Add extra context for the right click menu buttons.
    // This userInfo data is used in the main.js 'validate' event listener
    document.addEventListener('contextmenu', function(e) {
      safari.self.tab.setContextMenuEventUserInfo(e, {
        nodeName: e.target.nodeName,
        imageUrl: e.target.src,
        selectedText: document.getSelection().toString()
      });
    }, false);
});



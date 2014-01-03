$(function() {
    xt.port.emit('buffer_options');
    xt.port.on('buffer_options', function (options) {
        xt.options = options;
    });
    var overlayPort = PortWrapper(safari.self, "overlay");
    overlayPort.on("buffer_click", function(postData) {
        bufferData(overlayPort, postData);
    });
});

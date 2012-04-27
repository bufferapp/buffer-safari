$(function() {
    var overlayPort = PortWrapper(safari.self, "overlay");
    overlayPort.on("buffer_click", function(postData) {
        bufferData(overlayPort, postData);
    });
});
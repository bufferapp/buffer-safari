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

    document.addEventListener('contextmenu', attachDataToContextMenuEvent, false);

    // Add extra info to context menu events, available through event.userInfo
    function attachDataToContextMenuEvent(e) {
        var userInfo = {};
        var selectedText = document.getSelection().toString();

        if (e.target.nodeName == 'IMG') {
            userInfo.context = 'image';
            userInfo.imageUrl = e.target.src;
        } else if (selectedText.length) {
            userInfo.context = 'text';
            userInfo.selectedText = selectedText;
        } else {
            userInfo.context = 'page';
        }

        safari.self.tab.setContextMenuEventUserInfo(e, userInfo);
    }
});



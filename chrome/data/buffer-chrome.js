$(function() {
    chrome.extension.onConnect.addListener(function(chport) {
        
        var overlayPort = PortWrapper(chport);
        
        overlayPort.on("buffer_click", function() {
            bufferData(overlayPort);
        });
  
    });
});
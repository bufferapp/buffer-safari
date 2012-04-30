/*

Buffer for Safari

Authors: Tom Ashworth           Joel Gascoigne
         tom.a@bufferapp.com    joel@bufferapp.com

*/

// Configuration
var config = {};
config.plugin = {
    label: "Buffer This Page",
    guide: 'http://bufferapp.com/guides/safari',
    menu: {
        page: {
            label: "Buffer This Page"
        },
        selection: {
            label: "Buffer Selected Text"
        },
        image: {
            label: "Buffer This Image"
        },
    }
};

// Overlay
var attachOverlay = function (data, cb) {
    
    if( typeof data === 'function' ) cb = data;
    if( ! data ) data = {};
    if( ! cb ) cb = function () {};
    
    var tab = data.tab;
        
    var port = PortWrapper(tab, "main-overlay");

    // Remove the port once the Buffering is complete
    port.on('buffer_done', function (overlayData) {
        port.destroy();
        port = null;
        setTimeout(function () {
            cb(overlayData);
        }, 0);
    });
    
    // Inform overlay that click has occurred
    port.emit("buffer_click", data);
    
};

// Show the guide on first run
if( ! localStorage.getItem('buffer.run') ) {
    localStorage.setItem('buffer.run', true);
    safari.application.activeBrowserWindow.openTab(config.plugin.guide);
}

// Fire the overlay when the button is clicked
safari.application.addEventListener("command", function(ev) {
    if( ev.command === "buffer_click" ) attachOverlay({tab: safari.application.activeBrowserWindow.activeTab});
}, false);

// On navigate, check for embed matches
safari.application.addEventListener("navigate", function(ev) {
    console.log("Navigate", ev);
    //safariConditionalLoad();
}, false);

// Listen for embedded events (twitter/hacker news etc)
PortWrapper(safari.application.activeBrowserWindow).on("buffer_click", function(embed) {
    
    var tab = safari.application.activeBrowserWindow.activeTab;
    var port = PortWrapper(tab, "main-embed");
    
    // Listen for embedded triggers
    attachOverlay({tab: tab, embed: embed}, function (overlaydata) {
        if( !!overlaydata.sent ) {
            // Buffer was sent
            port.emit("buffer_embed_clear");
        }
    });
    
});

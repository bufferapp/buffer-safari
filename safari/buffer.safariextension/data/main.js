/*

Buffer for Safari

Authors: Tom Ashworth           Joel Gascoigne
         tom.a@bufferapp.com    joel@bufferapp.com

*/

// Configuration
var config = {};
config.plugin = {
    label: "Buffer This Page",
    guide: 'http://bufferapp.com/guides/safari/installed',
    restart: 'http://bufferapp.com/guides/safari/restart',
    version: "2.2.5",
    menu: {
        page: {
            label: "Buffer This Page"
        },
        selection: {
            label: "Buffer Selected Text"
        },
        image: {
            label: "Buffer This Image"
        }
    }
};

// Overlay
var attachOverlay = function (data, cb) {
    
    if( typeof data === 'function' ) cb = data;
    if( ! data ) data = {};
    if( ! cb ) cb = function () {};
    if( ! data.embed ) data.embed = {};
    
    var tab = data.tab;
        
    var port = PortWrapper(tab, "main-overlay");

    // Remove the port once the Buffering is complete
    port.on('buffer_done', function (overlayData) {
        if( port ) {
            port.destroy();
            port = null;
        }
        setTimeout(function () {
            cb(overlayData);
        }, 0);
    });
    
    // Don't try to JSON encode a tab
    data.tab = null;

    // Pass statistic data
    data.version = config.plugin.version;
	if( data.embed.placement ) data.placement = data.embed.placement;
    
	// Inform overlay that click has occurred
    port.emit("buffer_click", data);
};

var openTab = function (url) {
    // Open the guides
    var newTab = safari.application.activeBrowserWindow.openTab("foreground");
    newTab.url = url;
};

// Query for a specific tab by attribute and value
//
// Example:
//   var tabs = findTab('url', 'http://google.com');
//
// Returns an array of tabs
var findTab = function (attr, value) {
    var result = [];
    safari.application.browserWindows.forEach(function (window) {
        window.tabs.forEach(function (tab) {
            if( !! tab[attr] && typeof tab[attr] === "string" && tab[attr].match(value) ) {
                result.push(tab);
            }
        });
    });
    return result;
};

// Show restart guide on first run, then the guide
if( ! localStorage.getItem('buffer.run') && ! localStorage.getItem('buffer.restart') ) {
    localStorage.setItem('buffer.restart', true);
    openTab(config.plugin.restart);
} else {
    if( ! localStorage.getItem('buffer.run') ) {
        safari.application.addEventListener('beforeNavigate', function (ev) {
            if( ev.url.match(config.plugin.restart) ) {
                ev.target.close();
            }
        }, true);
        localStorage.setItem('buffer.restart', true);
        localStorage.setItem('buffer.run', true);
        openTab(config.plugin.guide);
    }
}

// Fire the overlay when the button is clicked
safari.application.addEventListener("command", function(ev) {
    if( ev.command === "buffer_click" ) {
        attachOverlay({
            tab: safari.application.activeBrowserWindow.activeTab,
            placement: 'toolbar'
        });
    }
}, false);

// Listen for embedded events (twitter/hacker news etc)
var embedPort = PortWrapper(safari.application.activeBrowserWindow);
embedPort.on("buffer_click", function(embed) {
    
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

var overlayPort;
embedPort.on("buffer_details_request", function () {

    var tab = safari.application.activeBrowserWindow.activeTab;
    var port = PortWrapper(tab, "main-embed");

    overlayPort = port;

    port.emit("buffer_details_request");

});

embedPort.on("buffer_details", function (data) {

    var tab = safari.application.activeBrowserWindow.activeTab;
    var port = PortWrapper(tab, "main-embed");

    if( overlayPort ) {
       overlayPort.emit("buffer_details", data);
    }

});

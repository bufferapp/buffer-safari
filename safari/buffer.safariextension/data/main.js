/*

Buffer for Safari

Authors: Tom Ashworth           Joel Gascoigne
         tom.a@bufferapp.com    joel@bufferapp.com

*/

// Grab info from Info.plist and convert it to Javascript object,
// and store it in safari.info
var req = new XMLHttpRequest();
req.open('GET', safari.extension.baseURI + 'Info.plist', false);
req.send();
safari.info = PlistParser.parse(req.responseXML);

// Configuration
var config = {};
config.plugin = {
    label: "Buffer This Page",
    guide: 'http://bufferapp.com/guides/safari/installed',
    restart: 'http://bufferapp.com/guides/safari/restart',
    version: safari.info.CFBundleShortVersionString,
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
safari.application.addEventListener('command', function(e) {

    // Standard toolbar button click
    if( e.command === 'buffer_click' ) {
        attachOverlay({
            tab: safari.application.activeBrowserWindow.activeTab,
            placement: 'toolbar'
        });
        return;
    }

    // Context menu click
    if( e.command === 'buffer_contextmenu_click' ) {
        contextMenuClick(e);
    }

}, false);


// The userInfo is being set in buffer-safari.js
safari.application.addEventListener('validate', function(e){
    
    e.target.title = 'Buffer This Page';

    if (e.userInfo.nodeName === 'IMG') {
        e.target.title = 'Buffer This Image';
    } else if (e.userInfo.selectedText) {
        e.target.title = 'Buffer This Text';
    }

}, false);

var contextMenuClick = function(e) {

    var placement = 'menu-page';

    if (e.userInfo.nodeName === 'IMG') {
        placement = 'menu-image';
    } else if (e.userInfo.selectedText) {
        placement = 'menu-selection';
    }

    attachOverlay({
        tab: safari.application.activeBrowserWindow.activeTab,
        placement: placement,
        image: e.userInfo.imageUrl
    });
};

var buildOptions = function () {

    var prefs = [
        {
            "name": "twitter",
            "value": safari.extension.settings.twitter
        },
        {
            "name": "facebook",
            "value": safari.extension.settings.facebook
        },
        {
            "name": "quora",
            "value": safari.extension.settings.quora
        },
        {
            "name": "reader",
            "value": safari.extension.settings.reader
        },
        {
            "name": "reddit",
            "value": safari.extension.settings.reddit
        },
        {
            "name": "hacker",
            "value": safari.extension.settings.hacker
        },
        {
            "name": "key-combo",
            "value": safari.extension.settings['key-combo']
        },
        {
            "name": "key-enable",
            "value": safari.extension.settings['key-enable']
        },
        {
            "name": "key-enable",
            "value": safari.extension.settings['key-enable']
        },
        {
            "name": "image-overlays",
            "value": safari.extension.settings['image-overlays']
        }
    ];

    var options = {}, pref;

    // Use "false" if false, and use the item name if true.
    // Stupid, yep, but it made sense in Chrome.
    // TODO: Make this less stupid.
    for( var i in prefs ) {
        if( prefs.hasOwnProperty(i) ) {
            pref = prefs[i];
            if( pref.name == 'key-combo' ) {
                options['buffer.op.key-combo'] = safari.extension.settings['key-combo'];
            } else {
                if( safari.extension.settings[pref.name] === false ) {
                    options["buffer.op." + pref.name] = "false";
                } else {
                    options["buffer.op." + pref.name] = pref.name;
                }
            }
        }
    }

    return options;
};

// Listen for embedded events (twitter/hacker news etc)
var embedPort = PortWrapper(safari.application);
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

embedPort.on("buffer_options", function(embed) {
    
    var tab = safari.application.activeBrowserWindow.activeTab;
    var port = PortWrapper(tab, "main-embed");

    port.emit('buffer_options', buildOptions());

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

embedPort.on('buffer_get_extesion_info', function () {

    var tab = safari.application.activeBrowserWindow.activeTab;
    var port = PortWrapper(tab, 'main-embed');

    port.emit('buffer_send_extesion_info', {
        version: safari.info.CFBundleShortVersionString
    });

});

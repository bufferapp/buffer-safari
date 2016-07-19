/* global safari, PlistParser, PortWrapper, _bmq */

/*

Buffer for Safari

Authors: Tom Ashworth           Joel Gascoigne
         tom.a@bufferapp.com    joel@bufferapp.com

*/

var extensionUserData = JSON.parse(localStorage.getItem('buffer.extensionUserData'));

// Grab info from Info.plist and convert it to Javascript object,
// and store it in safari.info
var req = new XMLHttpRequest();
req.open('GET', safari.extension.baseURI + 'Info.plist', false);
req.send();
safari.info = PlistParser.parse(req.responseXML);

// Configuration
var config = {};
config.plugin = {
    guide: 'http://buffer.com/guides/safari/installed',
    restart: 'http://buffer.com/guides/safari/restart',
    browser: 'safari',
    version: safari.info.CFBundleShortVersionString,

    contextMenu: {
        page: {
            command: 'contextmenu-buffer-page',
            label: 'Buffer This Page'
        },
        text: {
            command: 'contextmenu-buffer-text',
            label: 'Buffer Selected Text'
        },
        pablo_text: {
            command: 'contextmenu-pablo-text',
            label: 'Create Image With Pablo'
        },
        image: {
            command: 'contextmenu-buffer-image',
            label: 'Buffer This Image'
        },
        pablo_image: {
            command: 'contextmenu-pablo-image',
            label: 'Open Image With Pablo'
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

    // Map content script _bmq calls to the real _bmq here
    port.on('buffer_tracking', function(payload) {
        _bmq[payload.methodName].apply(_bmq, payload.args);
    });

    // Send cached user data to overlay when it opens up
    if (extensionUserData) {
      port.on('buffer_overlay_open', function() {
        port.emit('buffer_user_data', extensionUserData);
      });
    }

    // Listen for user data from buffer-overlay, and cache it here
    port.on('buffer_user_data', function(userData) {
      extensionUserData = userData;
      localStorage.setItem('buffer.extensionUserData', JSON.stringify(extensionUserData));
      port.emit('buffer_user_data', extensionUserData);
    });
};

var openTab = function (url) {
    // Open the guides
    var newTab = safari.application.activeBrowserWindow.openTab("foreground");
    newTab.url = url;
};

// For the open popup fallback:
var attachPopupHandler = function(tab) {
  tab.addEventListener('message', function (ev) {
    if (ev.name === 'buffer_open_popup') {
      var url = ev.message.src;
      var isSmallPopup = !!ev.message.isSmallPopup;

      if (isSmallPopup) {
        var smallPopup = safari.application.openBrowserWindow().activeTab;
        smallPopup.url = url;
        // Can't quite set the width/height with this API as far as the docs go
      } else {
        openTab(ev.message.src);
      }
    }
  }, false);
};

safari.application.browserWindows.forEach(function(window) {
  window.tabs.forEach(attachPopupHandler);
});

safari.application.addEventListener('open', function(e) {
    // The open event can be heard multiple times for multiple targets, e.g.
    // SafariBrowserTab, SafariBrowserWindow; only react to a SafariBrowserTab opening
    if (e.target instanceof SafariBrowserTab) attachPopupHandler(e.target);
}, true);

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

// The 'contextmenu' event is fired just before the 'validate' event
safari.application.addEventListener('contextmenu', handleContextMenu, false);

// Programmatically add items to the context menu
function handleContextMenu(e) {
    switch (e.userInfo.context) {
        case 'page':
            e.contextMenu.appendContextMenuItem(config.plugin.contextMenu.page.command, config.plugin.contextMenu.page.label);
            break;
        case 'text':
            e.contextMenu.appendContextMenuItem(config.plugin.contextMenu.text.command, config.plugin.contextMenu.text.label);
            e.contextMenu.appendContextMenuItem(config.plugin.contextMenu.pablo_text.command, config.plugin.contextMenu.pablo_text.label);
            break;
        case 'image':
            e.contextMenu.appendContextMenuItem(config.plugin.contextMenu.image.command, config.plugin.contextMenu.image.label);
            e.contextMenu.appendContextMenuItem(config.plugin.contextMenu.pablo_image.command, config.plugin.contextMenu.pablo_image.label);
            break;
    }
}

// Listen to clicks on buttons in the toolbar and in context menus
safari.application.addEventListener('command', performCommand, false);

function performCommand(e) {
    var shouldUsePablo = [config.plugin.contextMenu.pablo_text.command, config.plugin.contextMenu.pablo_image.command].indexOf(e.command) != -1;

    // Open text/image with Pablo
    if (shouldUsePablo) {
        var queryParam;

        if (e.command == config.plugin.contextMenu.pablo_text.command) queryParam = 'text=' + encodeURIComponent(e.userInfo.selectedText);
            else if (e.command == config.plugin.contextMenu.pablo_image.command) queryParam = 'image=' + encodeURIComponent(e.userInfo.imageUrl);

        queryParam += '&source_url=' + encodeURIComponent(e.userInfo.documentUrl);

        safari.application.activeBrowserWindow.openTab().url = 'https://buffer.com/pablo?' + queryParam;

    // Open page/text/image with Buffer
    } else {
        var overlayData = {
            tab: safari.application.activeBrowserWindow.activeTab
        };

        switch (e.command) {
            case 'buffer_click': // Click on toolbar button
                overlayData.placement = 'toolbar';
                break;
            case config.plugin.contextMenu.page.command:
                overlayData.placement = 'menu-page';
                break;
            case config.plugin.contextMenu.text.command:
                overlayData.placement = 'menu-selection';
                break;
            case config.plugin.contextMenu.image.command:
                overlayData.placement = 'menu-image';
                overlayData.image = e.userInfo.imageUrl;
                break;
        }

        attachOverlay(overlayData);
    }

}

var buildOptions = function () {

    var prefs = [
        {
            "name": "twitter",
            "value": safari.extension.settings.twitter
        },
        {
            "name": "tweetdeck",
            "value": safari.extension.settings.tweetdeck
        },
        {
            "name": "pinterest",
            "value": safari.extension.settings.pinterest
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

/**
 * Emits the options to the embedded scripts on the active tab.
 * The listener and requester is in buffer-safari.js
 */
function emitOptions() {
    var tab = safari.application.activeBrowserWindow.activeTab;
    var port = PortWrapper(tab, 'main-embed');

    port.emit('buffer_options', buildOptions());
}

embedPort.on('buffer_options', emitOptions);

// The options need to additionally be passed when the user switches to a new
// active tab. This fixes the issue with the breaking extension with
// "open link in new tab"
safari.application.addEventListener('activate', emitOptions, true);


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

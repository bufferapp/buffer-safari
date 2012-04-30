// Not used, but here for use in future. Doesn't quite work right.
var safariConditionalLoad = function () {
    
    var config = {};
    config.base = safari.extension.baseURI;
    config.scripts = [
        {
      	    matches: ["http://*.twitter.com/*", "https://*.twitter.com/*"],
    	    js: ["data/embeds/buffer-twitter.js"]
    	},
    	{
            matches: ["http://*.google.com/reader/*", "https://*.google.com/reader/*"],
    	    js: ["data/embeds/buffer-google-reader.js"]
    	},
    	{
            matches: ["http://*.ycombinator.org/*", "http://*.ycombinator.com/*"],
      	    js: ["data/embeds/buffer-hn.js"]
      	}
    ];
    
    var url = function (ob) {
        
        var scripts = [];
        
        if ( typeof ob === "string" ) scripts.push(ob);
        else scripts = ob;
        
        for( i in scripts ) {
            scripts[i] = config.base + scripts[i];
        }
        
        if( typeof ob === "string" ) return scripts[0];
        else return scripts;
        
    };
    
    var scripts = [], rtn = null;
    
    for(var set in config.scripts) {
        
        for(var script in config.scripts[set].js) {
            debugger;
            rtn = safari.extension.addContentScriptFromURL(url(config.scripts[set].js[script]), config.scripts[set].matches, [], false);
            if( rtn ) {
                //console.log(rtn, " was injected!");
            } else {
                log("removing", url(config.scripts[set].js[script]));
                safari.extension.removeContentScript(url(config.scripts[set].js[script]));
            }
        }
        
        for(var script in config.scripts[set].css) {
            //console.log("testing", url(config.scripts[set].css[script]), config.scripts[set].matches);
            safari.extension.addContentStyleSheetFromURL(url(config.scripts[set].css[script]), config.scripts[set].matches, [], false);
        }
        
    }
    
};
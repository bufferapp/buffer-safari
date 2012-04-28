;(function () {
    
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
    
    var scripts = [];
    
    for(var set in config.scripts) {
        
        for(var script in config.scripts[set].js) {
            safari.extension.addContentScriptFromURL(url(config.scripts[set].js[script]), config.scripts[set].matches, [], false);
        }
        
        for(var script in config.scripts[set].css) {
            safari.extension.addContentStyleSheetFromURL(url(config.scripts[set].css[script]), config.scripts[set].matches, [], false);
        }
        
    }
    
}());
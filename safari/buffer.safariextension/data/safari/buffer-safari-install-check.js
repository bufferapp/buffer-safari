$(function() {
	if (window.top === window) {
		if(document.location.host.match(/bufferapp.com/i)) {
			$('body').append('<div id="browser-extension-check" data-version=""></div>');
		}
	}
});

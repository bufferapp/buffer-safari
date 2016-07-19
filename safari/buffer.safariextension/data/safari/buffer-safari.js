/* global safari, bufferData, PortWrapper */

$(function() {

    xt.port.emit('buffer_options');
    xt.port.on('buffer_options', function(options) {
        if (!xt.options) xt.options = options;
    });

    var overlayPort = PortWrapper(safari.self, "overlay");

    // In most cases we'll want to simply open the overlay when a Buffer button
    // is clicked. In some specific cases, we'll want to provide a more tailored
    // experience, e.g. retweeting a tweet when we're on a tweet's permalink page
    // and the Buffer toolbar button is clicked
    overlayPort.on("buffer_click", function(postData) {
      var isTweetPermalinkPage = /twitter\.com\/[^/]+\/status\/\d+/.test(window.location.href);
      var $retweetButton = $('.permalink-tweet .ProfileTweet-action--buffer');

      var shouldTriggerRetweetButtonClick = (
        isTweetPermalinkPage &&
        postData.placement === 'toolbar' &&
        $retweetButton.length > 0
      );

      if (shouldTriggerRetweetButtonClick) {
        $retweetButton.click();
      } else {
        // bufferData is a method in buffer-overlay that creates
        // the overlay and gives it data.
        bufferData(overlayPort, postData);
      }
    });

    document.addEventListener('contextmenu', attachDataToContextMenuEvent, false);

    // Add extra info to context menu events, available through event.userInfo
    function attachDataToContextMenuEvent(e) {
        var userInfo = {
          documentUrl: document.URL
        };
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

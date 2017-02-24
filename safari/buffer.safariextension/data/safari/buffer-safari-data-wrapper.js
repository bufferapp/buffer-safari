var DataWrapper = function() {
  return {
    get: function(file) {
      return safari.extension.baseURI + file;
    }
  };
};

if(!xt) var xt = {};
xt.data = DataWrapper();

if (typeof(Storage) !== 'undefined') {
    // local storage is enabled
    sessionStorage.bufferExtensionInstalled = true;
}

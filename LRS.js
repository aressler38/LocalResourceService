(function (window) {

  window.LocalResourceService = window.LRS = LocalResourceService;

  /**
   * The base datastructure that is stored in the `LocalResourceService.resources` table.
   *
   * @constructor Resource
   */
  function Resource (uri, blob) {
    this.uri = uri;
    this.blob = blob;
  }

  /**
   * Defines a resources table that will contain entries of the form `{'keyName' : <Resource>}`.
   *
   *
   * @constructor LocalResourceService
   */
  function LocalResourceService () {
    this.resources = { };
    init_services.call(this);
  }


  LocalResourceService.prototype = {

    /**
     * Load a resource. This method will take relative or absolute url paths and 
     * fetch the resource. The resource will be blobified and inserted into the 
     * `resources` table.
     * @memberof LocalResourceService
     */
    load : function (url, config) {
      if ( ! config ) config = { } ;
      var xhr = this.services.get({ 
        url: url,
        success : function (xhr) {
          var blob = this.services.toBlob(xhr);
          var uri = window.URL.createObjectURL(blob);
          if ( ! config.keyName ) {
            var i=0;
            while ( this.resources['_'+i] ) ++i;
            config.keyName = '_'+i;
          }
          this.resources[config.keyName] = new Resource(uri, blob);
        }.bind(this)
      });
    },
    
    /**
     * Remove a resource. It's object URL is revoked and table entry deleted.
     * @memberof LocalResourceService
     */
    unload : function (keyName) {
      if ( this.resources[keyName] ) {
        URL.revokeObjectURL(this.resources[keyName].uri);
        delete this.resources[keyName];
      }
    }

  };


  /**
   * Establishes the `services` on the `LocalResourceService` during construction.
   * Creates an `onchange` hook for user defined event handling.
   *
   */
  function init_services () {
    var _lrs = this;
    var s = this.services = { };
    var _openXHR = { };
    this.onchange = function () { };
    s.xhr = function () {
      var xhr;
      try {
        xhr = new XMLHttpRequest();
      } catch ( e ) {
        throw e;
      }
      return xhr;
    };
    s.makeURL = function (urlstring) {
      var url;
      var href;
      try {
        url = new URL(urlstring);
      } catch ( DOMException ) {
        try {
          url = urlstring[0] === '/' ? 
            new URL(urlstring, window.location.protocol+'//'+window.location.hostname) :
            new URL(urlstring, window.location.href) ;
        } catch ( DOMException ) {
          throw '[ERROR] invalid urlstring';
        }
      }
      href = url.href;
      delete url;
      return href;
    };
    s.get = function (config) {
      if ( typeof config === 'string' ) {
        var c = { };
        c.url = config;
        config = c;
      }
      var xhr = this.xhr();
      var _id=0;
      while ( _openXHR[_id] ) ++_id;
      _openXHR[_id] = true; 
      xhr.open('GET', this.makeURL(config.url), true);
      xhr.onreadystatechange = function() {
        if ( this.readyState === 4) {
          if ( this.status === 200 ) {
            config.success(this);
          }
          delete _openXHR[_id];
          console.log("TRIGGER ONCHANGE:", _lrs);
          _xhrdone();
        }
      };
      if ( config.data ) xhr.send(config.data); else xhr.send();
      return xhr;
    };
    s.toBlob = function (xhr) {
      var mime = xhr.getResponseHeader('content-type');
      var blob = new Blob([xhr.response], {type : mime});
      return blob;
    };
    function _xhrdone() {
      var i = 0;
      for ( var x in _openXHR ) ++i;
      _lrs.onchange({ pending: i, ready: !i });
       


    }
  };


})(window);

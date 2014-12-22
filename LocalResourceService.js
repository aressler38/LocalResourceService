(function (window) {

  /**
   * @global
   */
  window.LocalResourceService = window.LRS = LocalResourceService;

  /**
   * The base datastructure that is stored in the `LocalResourceService.resources` table.
   *
   * @constructor Resource
   */
  function Resource (config) {
    this.uri = config.uri;
    this.blob = config.blob;
    this.data = config.data || null;
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

  // =================== PROTOTYPE ============================================

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
          var data = this.services.parseData(xhr);
          if ( ! config.keyName ) {
            var i=0;
            while ( this.resources['_'+i] ) ++i;
            config.keyName = '_'+i;
          }
          this.resources[config.keyName] = new Resource({
            uri: uri,
            blob: blob,
            data: data
          });
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
   */
  function init_services () {
    var _lrs = this;
    var s = this.services = { };
    var _openXHR = { };

    /**
     * This is executed when XHR objects finish.
     * @callback
     * @memberof LocalResourceService
     */
    this.onchange = function () { };

    /**
     * Try to create a new
     * @memberof LocalResourceService
     */
    s.xhr = function () {
      var xhr;
      try {
        xhr = new XMLHttpRequest();
      } catch ( e ) {
        throw e;
      }
      return xhr;
    };

    /**
     * Validate a url string and convert it to an absolute URL string.
     *
     * @memberof LocalResourceService
     * @param {string} urlstring Should be an absolute or relative URL string to a resource.
     */
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

    /**
     * Make an HTTP GET request to the configured url.
     * On a successful transfer, execute the success callback.
     *
     * @memberof LocalResourceService
     * @param {object} config A general configuration object
     * @param {string} config.success Callback for XHR success completion.
     *                  The xhr object is passed as the first parameter.
     * @param {string} config.url Absolute or relative URL string to resource.
     */
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
      xhr.responseType = 'arraybuffer';
      xhr.onreadystatechange = function() {
        if ( this.readyState === 4) {
          if ( this.status === 200 ) {
            config.success(this);
          }
          delete _openXHR[_id];
          delete xhr;
          _xhrdone();
        }
      };
      if ( config.data ) xhr.send(config.data); else xhr.send();
      return xhr;
    };

    /**
     * Given a completed XHR object, parse the resources content type and create
     * a Blob for it.
     *
     * @memberof LocalResourceService
     * @param {XMLHttpRequest} xhr The completely ready XHR object.
     * @return {Blob} blob this is the blob representing the XHR response.
     */
    s.toBlob = function (xhr) {
      var mime = xhr.getResponseHeader('content-type');
      var blob = new Blob([xhr.response], {type : mime});
      return blob;
    };


    /**
     * Given a completed XHR object, parse the content and return the parsed data.
     * Return null if nothing is parsed.
     *
     * @memberof LocalResourceService
     * @param  {XMLHttpRequest} xhr The completely ready XHR object.
     */
    s.parseData = function (xhr) {
      switch ( xhr.getResponseHeader('content-type') ) {
        case "application/javascript":
          var dv = new DataView(xhr.response);
          var js = '';
          for ( var i=0; i<dv.byteLength; ++i ) {
            js += String.fromCharCode(dv.getUint8(i));
          }
          return eval(js);
        default:
          return null;
      }
    };

    // private: executes the onchange callback and passes the status
    function _xhrdone() {
      var i = 0;
      for ( var x in _openXHR ) ++i;
      _lrs.onchange({ pending: i, ready: !i });
    }

  };


})(window);

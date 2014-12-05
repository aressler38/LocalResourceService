## LocalResourceService
Provides a lightweight API to create object URLs during runtime.


## About
This is a resource loader that makes an XHR call to load a remote resource and 
creates an [objectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL.createObjectURL).
This gives the user the ability to dynamically change loaded resources that would have otherwise been 
static.

## Examples
    
### load a resource

    var lrs = new LRS();
    lrs.onchange = function (state) {
      if ( state.ready )  {
        // all assets loaded
      }
    }
    lrs.load('assets/foo.png' { keyName : 'png1' });  // => lrs.resources.png1
    lrs.load('assets/bar.png' { keyName : 'png2' }); // => lrs.resources.png2
    
    
    
    



## TODO
1. Implement blob change events and handlers.
1. Better automated MIME handling for common types (JSON, image, etc.).

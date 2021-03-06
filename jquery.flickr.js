/*****************************************
 * Flickr API (in jQuery)
 * version: 1.0 (02/23/2009)
 * written for jQuery 1.3.2
 * by Ryan Heath (http://rpheath.com)
 * modified by Justin Geeslin (@justingeeslin)
 *****************************************/
(function($) {
  // core extensions
  $.extend({
    // determines if an object is empty
    // $.isEmpty({})             // => true
    // $.isEmpty({user: 'rph'})  // => false
    isEmpty: function(obj) {
      for (var i in obj) { return false }
      return true
    }
  })
  
  // base flickr object
  $.flickr = {
    // the actual request url
    // (constructs extra params as they come in)
    url: function(method, params) {
      //Remove event handlers / functions from params
      var p = $.extend(true, {}, params);
      for(prop in p) {
        if (typeof p[prop] == 'function')
          p[prop] = undefined;
      }
      p.api_key = (p.api_key !== undefined ? p.api_key : $.flickr.settings.api_key)
      return 'http://api.flickr.com/services/rest/?method=' + method + '&format=json' + ($.isEmpty(p) ? '' : '&' + $.param(p)) + '&nojsoncallback=1';
    },
    // translate plugin image sizes to flickr sizes
    translate: function(size) {
      switch(size) {
        case 'sq': return '_s' // square
        case 'lsq': return '_q' // large square
        case 't' : return '_t' // thumbnail
        case 's' : return '_m' // small
        case 's320' : return '_n' // small 320
        case 'm' : return ''   // medium
        case 'm640' : return '_z'   // medium 640
        case 'm800' : return '_c'   // medium 800
        case 'l' : return '_b'   // large
        case 'o' : return '_o'   // original
        default  : return ''   // medium
      }
    },
    // determines what to do with the links
    linkTag: function(text, photo, href) {
      if (href === undefined) href = ['http://www.flickr.com/photos', (photo.owner === undefined ? $.flickr.settings.user_id : photo.owner), (photo.primary !== undefined ? photo.primary : photo.id)].join('/')      
      if (photo.primary === undefined) {
        //Photo
        data = 'data-photo-id="' + photo.id + '" ';
      }
      else {
        //Photoset
        data = 'data-photo-id="' + photo.primary + '" data-photoset-id="' + photo.id + '"';
      }

      var size = $.flickr.settings.link_to_size
      if (size != undefined && size.match(/sq|t|s|m|o/)) 
        data += 'data-photo-href="' + $.flickr.thumbnail.src(photo, $.flickr.translate(size)) + '" '

      return '<a href="' + href + '" title="' + (photo.title._content === undefined ? photo.title : photo.title._content) + '" ' + data + '>' + text + '</a>'
    }
  }
  
  // helper methods for thumbnails
  $.flickr.thumbnail = {
    src: function(photo, size) {
      if (size === undefined) size = $.flickr.translate($.flickr.settings.thumbnail_size)
      return 'http://farm' + photo.farm + '.static.flickr.com/' + photo.server + 
        '/' + (photo.primary !== undefined ? photo.primary : photo.id) + '_' + photo.secret + size + '.jpg'
    },
    imageTag: function(image) {
      return '<img src="' + image.src + '" alt="' + image.alt + '" />'
    }
  }
  
  // accepts a series of photos and constructs
  // the thumbnails that link back to Flickr
  $.flickr.thumbnail.process = function(photos) {
      var thumbnails = $.map((photos.photo === undefined ? photos.photoset : photos.photo), function(photo) {
        var image = new Image(), html = '', href = undefined

        image.src = $.flickr.thumbnail.src(photo)
        image.alt = (photo.title._content === undefined ? photo.title : photo.title._content) 
        
        html = $.flickr.linkTag($.flickr.thumbnail.imageTag(image), photo, href)
          
        return ['<div class="item">' + html + '</div>']
      }).join("\n")
    
    
    return $(thumbnails);
  }
  
  // handles requesting and thumbnailing photos
  $.flickr.photos = function(method, options) {
    var options = $.extend($.flickr.settings, options || {}),
        elements = $.flickr.self, photos

    return elements.each(function() {
      $.getJSON($.flickr.url(method, options), function(data) {
        if (data.photos !== undefined) {
          elements.append($.flickr.thumbnail.process(data.photos));
        }
        else if (data.photoset !== undefined) {
          elements.append($.flickr.thumbnail.process(data.photoset));
        }
        else if (data.photosets !== undefined) {
          elements.append($.flickr.thumbnail.process(data.photosets));
        }
        
        //Callback
        if (typeof $.flickr.settings.onComplete == 'function') {
          $.flickr.settings.onComplete(); 
        }
        
      })
    })
  }
  
  // namespace to hold available API methods
  // note: options available to each method match that of Flickr's docs
  $.flickr.methods = {
    // http://www.flickr.com/services/api/flickr.photos.getRecent.html
    photosGetRecent: function(options) {
      $.flickr.photos('flickr.photos.getRecent', options)
    },
    // http://www.flickr.com/services/api/flickr.photos.getContactsPublicPhotos.html
    photosGetContactsPublicPhotos: function(options) {
      $.flickr.photos('flickr.photos.getContactsPublicPhotos', options)
    },
    // http://www.flickr.com/services/api/flickr.photos.search.html
    photosSearch: function(options) {
      $.flickr.photos('flickr.photos.search', options)
    },
    // http://www.flickr.com/services/api/flickr.photosets.getList.html
    photosetsGetList: function(options) {
      $.flickr.photos('flickr.photosets.getList', options)
    },
    // http://www.flickr.com/services/api/flickr.photosets.getPhotos.html
    photosetsGetPhotos: function(options) {
      $.flickr.photos('flickr.photosets.getPhotos', options)
    }
  }
  
  // the plugin
  $.fn.flickr = function(options) {
    $.flickr.self = $(this)
    
    // base configuration
    $.flickr.settings = $.extend({
      api_key: 'YOUR API KEY',
      thumbnail_size: 'sq',
      page: 1,
      onComplete: false
    }, options || {})
    
    return $.flickr.methods
  }
})(jQuery);
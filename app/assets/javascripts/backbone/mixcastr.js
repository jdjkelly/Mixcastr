_.templateSettings = {
      evaluate : /\{\[([\s\S]+?)\]\}/g,
      interpolate : /\{\{([\s\S]+?)\}\}/g
    };

//Router
var Router = Backbone.Router.extend({
    routes: {
      	"": "index",
      	"tracks?q=:q": "tracks"
    },

    index: function(hash) {
    	var route = this;
      	var search = new window.SearchView();

     	// Attach the tutorial to the DOM
      	search.render();

    	// Fix for hashes in pushState and hash fragment
       	if (hash && !route._alreadyTriggered) {
	       	// Reset to home, pushState support automatically converts hashes
         	Backbone.history.navigate("", false);
         	// Trigger the default browser behavior
	      	location.hash = hash;
			// Set an internal flag to stop recursive looping
	        route._alreadyTriggered = true;
	    }
   		
  	},

  	tracks: function(q) {
        var tracks = new window.TracksView();
        tracks.render();
    }
});

window.Track = Backbone.Model.extend({});

window.Tracks = Backbone.Collection.extend({
	model: Track,
  url: "tracks.json"
});

window.TrackList = new Tracks;

window.TracksView = Backbone.View.extend({

	el: $("#main"),

  template: _.template($("#tracks").html()),

	search: function(q) {
    $.get('/tracks.json?q=' + q, function(data) {
      for(var i in data) {
        var track = TrackList.create({
          permalink_url: data[i].permalink_url,
          artwork_url: data[i].artwork_url,
          title: data[i].title,
          silent: true
        })

        var tracks = new TracksView({model: track});
        tracks.render();
        
      }
    });
   
	},

	render: function () {
    if ($(".thumbnails").length > 0) {
      $(".thumbnails").append(this.template(this.model.toJSON()));
    }
		else {
      $(this.el).html('<ul class="thumbnails"></ul>');
      $(".thumbnails").append(this.template(this.model.toJSON()));  
    }
    bindTracks();
	}
});

window.SearchView = Backbone.View.extend({
	el: $("#main"),

	template: _.template($("#search").html()),

	events: {
		"click .btn": "submit",
    "submit form": "submit"
	},

  submit: function(e) {
    e.preventDefault();
    this.search($("#q").val());
    $(this.el).children().fadeOut(500);
    $("#progress").show();
  },

	search: function(value) {
		if (!value) return;
		router.navigate("tracks?q=" + value);
		var tracks = new window.TracksView();
		tracks.search(value);
	},

	render: function() {
		$("#main").html(this.template());
  }
});

// Treat the jQuery ready function as the entry point to the application.
// Inside this function, kick-off all initialization, everything up to this
// point should be definitions.
$(function() {
	// Define your master router on the application namespace and trigger all
	// navigation from this instance.
    window.router = new Router();

    // Trigger the initial route and enable HTML5 History API support
    Backbone.history.start({ pushState: true });


});

// All navigation that is relative should be passed through the navigate
// method, to be processed by the router.  If the link has a data-bypass
// attribute, bypass the delegation completely.
$(document).on("click", "a:not([data-bypass])", function(evt) {
	// Get the anchor href and protcol
   	var href = $(this).attr("href");
    var protocol = this.protocol + "//";

    // Ensure the protocol is not part of URL, meaning its relative.
    if (href && href.slice(0, protocol.length) !== protocol &&
        href.indexOf("javascript:") !== 0) {
      // Stop the default event to ensure the link will not cause a page
      // refresh.
      evt.preventDefault();

      // This uses the default router defined above, and not any routers
      // that may be placed in modules.  To have this work globally (at the
      // cost of losing all route events) you can change the following line
      // to: Backbone.history.navigate(href, true);
      window.router.navigate(href, true);
    }
  });
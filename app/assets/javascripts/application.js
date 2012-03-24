// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// the compiled file.
//
// WARNING: THE FIRST BLANK LINE MARKS THE END OF WHAT'S TO BE PROCESSED, ANY BLANK LINE SHOULD
// GO AFTER THE REQUIRES BELOW.
//
//= require jquery
//= require jquery_ujs
//= require twitter/bootstrap
//= require underscore-min
//= require backbone-min
//= require supersized.core.3.2.1.min
//= require backbone/mixcastr
//= require json2

$(document).ready(function() {
	$.supersized({
		slides  :  	[ {image : '/background.jpg', title : 'Image Credit: Maria Kazvan'} ]
	});
	$("body").stratus(
      {
        color: "491521",
        align: "bottom",
        links: "http://soundcloud.com/torrotorro/clockwork-squad-up-torro-torro",
        animate: false,
        theme: "http://mixcastr.com/assets/stratus.css"
      }
    );
});

function bindTracks() {
	$("a.stratus").unbind();
	$("a.stratus").bind("click", function(e) {
    	e.preventDefault();
    	$.postMessage($(this).attr("href"), "http://stratus.sc/player?align=top&animate=slide&auto_play=false&buying=true&color=491521&download=true&env=production&key=ybtyKcnlhP3RKXpJ58fg&links=http%3A%2F%2Fsoundcloud.com%2Fsalacioussound&random=false&redirect=http%3A%2F%2Fstratus.sc%2Fcallback.html&user=true&stats=true&volume=50&link=http%3A%2F%2Fmixcastr.com", $('#stratus iframe').get(0).contentWindow);
    	return false;
    });
    $(".thumbnails li a").hover(
		function() {
			$(this).children("img").css("opacity","0.8")
			$(this).children("h4").fadeIn();
		},
		function() {
			$(this).children("img").css("opacity","1")
			$(this).children("h4").fadeOut();
		}
	);
}

function createNotificationInstance(image,title,content) {
	return window.webkitNotifications.createNotification(
        image, title, content).show().delay(1500).hide();
}
var iTunesControl = require("itunescontrol");

iTunesControl.search("Llegas aburrimiento", function(results) {
	console.log("Results!", results);
	iTunesControl.play(results[0].id);
});
var mongoose = require ('mongoose');

// Defind profile schema

var ProfileSchema = new mongoose.Schema({
	// id : String,
	first_name : {
		type : String,
		required : true
	}, 
	last_name : String,
	profile_pic : String,
	locale : String,
	timezone : Number,
	gender : String
});

var Profile = mongoose.model('Game',ProfileSchema);
module.exports = Profile;

// first_name,last_name,profile_pic,locale,timezone,gender
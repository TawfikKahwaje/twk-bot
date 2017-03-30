var Profile = require('./profile.js');

module.exports = {
	// save new profile 
	newProfile : function(body){
		// chech if i have it in my data depens on first_name 
		Profile.findOne({first_name:body.first_name}).exec(function (err, item){
			if(err){
				console.log(err);
			}
			else{
				console.log("item :", item)
				if(!item) return;
				else {
					// here save profile
					var profile = new Profile(body);
					profile.save(function(err, newProfile){
						if(err){
							console.log(err);
						}else{
							console.log("newProfile :", newProfile);
						}
					})
				}
			}
		})
	},
	// get all profiles
	getAll : function (req, res, next) {
		Profile.find().exec(function (err, allProfiles) {
			if(err){
				res.status(500).send('err');
			}else{
				res.status(200).send(allProfiles);
			}
		});
	}
}
var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');


var houseSchema = mongoose.Schema({
	data: Object
})

var barSchema = mongoose.Schema({
	data: Object
})


exports.House = mongoose.model('House', houseSchema);

exports.Bar = mongoose.model('Bar', barSchema);
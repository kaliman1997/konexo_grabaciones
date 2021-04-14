const mongoose = require('mongoose');
var Schema     = mongoose.Schema;

var groupSchema = new Schema({
	documentName: {
		type    : Schema.Types.String,
		required: true
	},
	groups       : [
		new Schema({
			id  : {
				type    : Schema.Types.String,
				required: true
			},
			name: {
				type    : Schema.Types.String,
				required: false
			}
		})
	]

});

const groupMongoSchemaObject = mongoose.model("groups", groupSchema);
module.exports = groupMongoSchemaObject;

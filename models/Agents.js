const mongoose = require('mongoose');
var Schema     = mongoose.Schema;

var agentSchema = new Schema({
	documentName: {
		type    : Schema.Types.String,
		required: true
	},
	agents       : [
		new Schema({
			id  : {
				type    : Schema.Types.String,
				required: true
			},
			name: {
				type    : Schema.Types.String,
				required: false
			},
			username: {
				type    : Schema.Types.String,
				required: false
			}
		})
	]

});

const agentMongoSchemaObject = mongoose.model("agents", agentSchema);
module.exports = agentMongoSchemaObject;

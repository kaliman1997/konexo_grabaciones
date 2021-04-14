const mongoose = require('mongoose');
var Schema     = mongoose.Schema;

var queueSchema = new Schema({
	documentName: {
		type    : Schema.Types.String,
		required: true
	},
	queues       : [
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

const queueMongoSchemaObject = mongoose.model("queues", queueSchema);
module.exports = queueMongoSchemaObject;

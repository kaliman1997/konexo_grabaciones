const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PresenceDefinitions = Schema({
    documentName: {
        type    : Schema.Types.String,
        required: true
    },
    presenceDefinitions       : [
        new Schema({
            id  : {
                type    : Schema.Types.String,
                required: true
            },
            description: {
                type    : Schema.Types.String,
                required: false
            },
            systemPresence: {
                type    : Schema.Types.String,
                required: false
            },
            primary: {
                type    : Schema.Types.Boolean,
                required: false
            }
        })
    ]
});

module.exports = mongoose.model("PresenceDefinitions", PresenceDefinitions);

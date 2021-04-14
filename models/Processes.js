const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var processesSchema = Schema({
    name: String,
    operation: String,
    media_type: String,
    created_at: String,
    user: String,
    filters: {
        start_time: String,
        end_time: String,
        agent: [{
            id: String,
            name: String
        }],
        group: [{
            id: String,
            name: String
        }]
    },
    status: String,
    progress: Number,
    campo_personalizado: String
});

module.exports = mongoose.model("Processes", processesSchema);
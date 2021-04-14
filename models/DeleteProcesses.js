const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var deleteProcessesSchema = Schema({
    name: String,
    media_type: String,
    created_at: String,
    user: String,
    filters: {
        start_date: String,
        end_date: String,
        logins: [{
            id: String,
            name: String
        }],
        group: [{
            id: String,
            name: String
        }]
    },
    status: String,
    progress: String
});

module.exports = mongoose.model("delete_processes", deleteProcessesSchema);
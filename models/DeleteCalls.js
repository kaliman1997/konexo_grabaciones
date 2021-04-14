const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var deleteCallSchema = Schema({
    call_id: String,
    process: String,
    direction: String,
    division: String,
    agent: String,
    group: String,
    ani: String,
    dnis: String,
    start_time: String,
    end_time: String
});

module.exports = mongoose.model("deleted_calls", deleteCallSchema);
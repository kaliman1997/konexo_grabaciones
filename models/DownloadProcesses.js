const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var donwloadProcessesSchema = Schema({
    name: String,
    created_at: String,
    status: String,
    user: String,
    download_directory: String,
    filters: {
        call_start: {
            mode: String,
            time_frame: {
                start_date: String,
                end_date: String
            },
            n_days: Number
        },
        logins: [{
                id: String,
                name: String
            }],
        group: [{
                id: String,
                name: String
            }]
    },
    rename_order: [String],
    schedule: {
        mode: String,
        run_time: String
    },
    last_run_time: String
});

module.exports = mongoose.model("download_processes", donwloadProcessesSchema);
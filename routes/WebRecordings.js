const logger = require("./Logger");
const express = require('express');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const router = express.Router();

router.use('/WebRecordings/assets', express.static('WebInterfaceRecordings/assets'));

router.get('/WebRecordings', async function (req, res) {
    res.sendFile(path.join(process.cwd() + '/WebInterfaceRecordings/index.html'));
});

router.get('/WebRecordings/Download', async function (req, res) {
    res.sendFile(path.join(process.cwd() + '/WebInterfaceRecordings/downloadProcesses.html'));
});

router.get('/WebRecordings/Delete', async function (req, res) {
    res.sendFile(path.join(process.cwd() + '/WebInterfaceRecordings/deleteProcesses.html'));
});

router.get('/WebRecordings/ViewCalls/:id', async function (req, res) {

    res.sendFile(path.join(process.cwd() + '/WebInterfaceRecordings/viewCalls.html'));
});

module.exports = router;

const logger      = require("./Logger");
const Tools       = require("./Tools");
const QueuesModel = require("../models/Queues");
const rax         = require('retry-axios');
const axios       = require('axios').default;
const excel       = require('excel4node');
const moment      = require('moment');
const fs          = require('fs');
const path        = require('path');
const jsonata     = require('jsonata');
var opts          = {};

var Reporte2   = {

	    createReport: async function (token, optsParameter) {

		    opts = optsParameter;
		    logger.info(opts);
		    logger.info("===== INICIANDO REPORTE =====");

		    let extractionDate = opts.startDate + "/" + opts.finalDate;

		    let timeSlots    = Tools.getSlotsIntervals();
		    let dayIntervals = Tools.getDayIntervals(opts.startDate, opts.finalDate);

		    var excelData = [];
		    try {

			    for (const queueObject of opts.searchData) {

				    logger.error(queueObject.queueId);
				    let calls = await this.getCallInfo(token, queueObject.queueId, extractionDate);

				    /***
				     * Check if filename already exists, if yes, delete it
				     */
				    let fileName = 'report2_job_' + queueObject.queueId + '.json';
				    fs.unlink(path.join(process.cwd(), 'log', fileName), function (err) {
					    if (err && err.code === 'ENOENT') {
					    }
					    else if (err) {
					    }
					    else {
						    logger.info(path.join(path.join(process.cwd(), 'log', fileName)) + ', already exits, remove it');
					    }
				    });

				    fs.writeFileSync(path.join(process.cwd(), 'log', fileName), JSON.stringify(calls));
			    }

			    for (const dayInterval of dayIntervals) {

				    for (const queueObject of opts.searchData) {

					    let queueName = "";
					    try {

						    await QueuesModel.find({"documentName": 'QueueList'}).then(function (response) {

							    if (typeof response === 'undefined') {

								    console.log("undefined!!!!");
							    }

							    let queueExpression = jsonata("$[id = '" + queueObject.queueId + "']");
							    let resultQueue     = queueExpression.evaluate(response[0].queues);

							    //logger.info(JSON.stringify(resultQueue, null, 4));

							    queueName                 = resultQueue.name;
							    opts.searchData.queueName = resultQueue.name;

						    }).catch(function (error) {

							    logger.error("Error on /AgentList ", error);
						    });
					    }
					    catch (e) {

						    logger.error("Error on /AgentList ", e);
					    }

					    let fileName = 'report2_job_' + queueObject.queueId + '.json';
					    calls        = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'log', fileName), 'utf8'));

					    let reportStructure = {
						    timeSlot       : moment(dayInterval).format("MM/DD/YYYY"),
						    queue          : queueName,
						    acdCalls       : 0,
						    nAbandon       : 0,
						    nAlertAbandon  : 0,
						    nAbandonUnder1 : 0,
						    nAbandonUnder2 : 0,
						    nAbandonUnder3 : 0,
						    nAbandonUnder4 : 0,
						    nAbandonUnder5 : 0,
						    nAbandonUnder6 : 0,
						    nAbandonUnder7 : 0,
						    nAbandonUnder8 : 0,
						    nAbandonUnder9 : 0,
						    nAbandonUnder10: 0,
						    nAbandonHold   : 0,
						    abandonAvg     : 0
					    };

					    let acdCallsCounter        = 0;
					    let nAbandonCounter        = 0;
					    let nAlertAbandonCounter   = 0;
					    let nAbandonUnder1Counter  = 0;
					    let nAbandonUnder2Counter  = 0;
					    let nAbandonUnder3Counter  = 0;
					    let nAbandonUnder4Counter  = 0;
					    let nAbandonUnder5Counter  = 0;
					    let nAbandonUnder6Counter  = 0;
					    let nAbandonUnder7Counter  = 0;
					    let nAbandonUnder8Counter  = 0;
					    let nAbandonUnder9Counter  = 0;
					    let nAbandonUnder10Counter = 0;
					    let nAbandonHoldCounter    = 0;

					    let intervalRegistersExpression = jsonata("$[$toMillis(conversationStart) >= $toMillis('" + dayInterval + "T00:00:00.000Z') and $toMillis(conversationStart) <= $toMillis('" + dayInterval + "T23:59:59.999Z')]");
					    let intervalRegisters           = intervalRegistersExpression.evaluate(calls);

					    let acdCallsExpression = jsonata("$count(participants[purpose='acd'].sessions.metrics[$.'name' = 'nOffered'].($.'value'))");
					    let acdCalls           = acdCallsExpression.evaluate(intervalRegisters);
					    acdCallsCounter        = acdCallsCounter + (acdCalls || 0);

					    let nAbandonExpression = jsonata("$count(participants[purpose='acd'].sessions.metrics[$.'name' = 'tAbandon'].($.'value'))");
					    let nAbandon           = nAbandonExpression.evaluate(intervalRegisters);
					    nAbandonCounter        = nAbandonCounter + (nAbandon || 0);

					    let nAbandonUnder1Expression = jsonata("$count($filter(participants[purpose='acd'].sessions.metrics[$.'name' = 'tAbandon'].($.'value'), function($v, $i){$v < 1000}))");
					    let nAbandonUnder1           = nAbandonUnder1Expression.evaluate(intervalRegisters);
					    nAbandonUnder1Counter        = nAbandonUnder1Counter + (nAbandonUnder1 || 0);

					    let nAbandonUnder2Expression = jsonata("$count($filter(participants[purpose='acd'].sessions.metrics[$.'name' = 'tAbandon'].($.'value'), function($v, $i){$v < 1000}))");
					    let nAbandonUnder2           = nAbandonUnder2Expression.evaluate(intervalRegisters);
					    nAbandonUnder2Counter        = nAbandonUnder2Counter + (nAbandonUnder2 || 0);

					    let nAbandonUnder3Expression = jsonata("$count($filter(participants[purpose='acd'].sessions.metrics[$.'name' = 'tAbandon'].($.'value'), function($v, $i){$v < 1000}))");
					    let nAbandonUnder3           = nAbandonUnder3Expression.evaluate(intervalRegisters);
					    nAbandonUnder3Counter        = nAbandonUnder3Counter + (nAbandonUnder3 || 0);

					    let nAbandonUnder4Expression = jsonata("$count($filter(participants[purpose='acd'].sessions.metrics[$.'name' = 'tAbandon'].($.'value'), function($v, $i){$v < 1000}))");
					    let nAbandonUnder4           = nAbandonUnder4Expression.evaluate(intervalRegisters);
					    nAbandonUnder4Counter        = nAbandonUnder4Counter + (nAbandonUnder4 || 0);

					    let nAbandonUnder5Expression = jsonata("$count($filter(participants[purpose='acd'].sessions.metrics[$.'name' = 'tAbandon'].($.'value'), function($v, $i){$v < 1000}))");
					    let nAbandonUnder5           = nAbandonUnder5Expression.evaluate(intervalRegisters);
					    nAbandonUnder5Counter        = nAbandonUnder5Counter + (nAbandonUnder5 || 0);

					    let nAbandonUnder6Expression = jsonata("$count($filter(participants[purpose='acd'].sessions.metrics[$.'name' = 'tAbandon'].($.'value'), function($v, $i){$v < 1000}))");
					    let nAbandonUnder6           = nAbandonUnder6Expression.evaluate(intervalRegisters);
					    nAbandonUnder6Counter        = nAbandonUnder6Counter + (nAbandonUnder6 || 0);

					    let nAbandonUnder7Expression = jsonata("$count($filter(participants[purpose='acd'].sessions.metrics[$.'name' = 'tAbandon'].($.'value'), function($v, $i){$v < 1000}))");
					    let nAbandonUnder7           = nAbandonUnder7Expression.evaluate(intervalRegisters);
					    nAbandonUnder7Counter        = nAbandonUnder7Counter + (nAbandonUnder7 || 0);

					    let nAbandonUnder8Expression = jsonata("$count($filter(participants[purpose='acd'].sessions.metrics[$.'name' = 'tAbandon'].($.'value'), function($v, $i){$v < 1000}))");
					    let nAbandonUnder8           = nAbandonUnder8Expression.evaluate(intervalRegisters);
					    nAbandonUnder8Counter        = nAbandonUnder8Counter + (nAbandonUnder8 || 0);

					    let nAbandonUnder9Expression = jsonata("$count($filter(participants[purpose='acd'].sessions.metrics[$.'name' = 'tAbandon'].($.'value'), function($v, $i){$v < 1000}))");
					    let nAbandonUnder9           = nAbandonUnder9Expression.evaluate(intervalRegisters);
					    nAbandonUnder9Counter        = nAbandonUnder9Counter + (nAbandonUnder9 || 0);

					    let nAbandonUnderExpression = jsonata("$count($filter(participants[purpose='acd'].sessions.metrics[$.'name' = 'tAbandon'].($.'value'), function($v, $i){$v < 10000}))");
					    let nAbandonUnder10         = nAbandonUnderExpression.evaluate(intervalRegisters);
					    nAbandonUnder10Counter      = nAbandonUnder10Counter + (nAbandonUnder10 || 0);

					    reportStructure.acdCalls        = acdCallsCounter;
					    reportStructure.nAbandon        = nAbandonCounter;
					    reportStructure.nAlertAbandon   = 0;
					    reportStructure.nAbandonUnder1  = nAbandonUnder1Counter;
					    reportStructure.nAbandonUnder2  = nAbandonUnder2Counter;
					    reportStructure.nAbandonUnder3  = nAbandonUnder3Counter;
					    reportStructure.nAbandonUnder4  = nAbandonUnder4Counter;
					    reportStructure.nAbandonUnder5  = nAbandonUnder5Counter;
					    reportStructure.nAbandonUnder6  = nAbandonUnder6Counter;
					    reportStructure.nAbandonUnder7  = nAbandonUnder7Counter;
					    reportStructure.nAbandonUnder8  = nAbandonUnder8Counter;
					    reportStructure.nAbandonUnder9  = nAbandonUnder9Counter;
					    reportStructure.nAbandonUnder10 = nAbandonUnder10Counter;
					    reportStructure.nAbandonHold    = 0;
					    reportStructure.abandonAvg      = (nAbandonCounter * 100) / acdCallsCounter;

					    excelData.push(reportStructure);


				    }
			    }

			    for (const queueObject of opts.searchData) {

				    let fileName = 'report2_job_' + queueObject.queueId + '.json';
				    fs.unlink(path.join(process.cwd(), 'log', fileName), function (err) {
					    if (err && err.code === 'ENOENT') {
					    }
					    else if (err) {
					    }
				    });
			    }
		    }
		    catch (error) {

			    logger.error(error);
		    }

		    await this.createExcel(excelData, optsParameter);

	    },
	    getCallInfo : async function (token, queueUUID, extractionDate) {

		    nextPage = 1;

		    var data = {
			    "interval"      : extractionDate,
			    "order"         : "asc",
			    "orderBy"       : "conversationStart",
			    "paging"        : {
				    "pageSize"  : 1000,
				    "pageNumber": 1
			    },
			    "segmentFilters": [
				    {
					    "type"      : "and",
					    "predicates": [
						    {
							    "type"     : "dimension",
							    "dimension": "queueId",
							    "operator" : "matches",
							    "value"    : queueUUID
						    },
						    {
							    "type"     : "dimension",
							    "dimension": "mediaType",
							    "operator" : "matches",
							    "value"    : "voice"
						    }
					    ]
				    }
			    ]
		    };

		    var options = {
			    method   : 'POST',
			    url      : process.env.URLPETICION + 'analytics/conversations/details/jobs',
			    headers  : {
				    'Authorization': token.token_type + ' ' + token.access_token,
				    'Content-Type' : 'application/json'
			    },
			    data     : data,
			    raxConfig: {
				    retry             : 3,
				    noResponseRetries : 2,
				    retryDelay        : 1000,
				    httpMethodsToRetry: ['GET', 'HEAD', 'OPTIONS', 'DELETE', 'PUT', 'POST'],
				    statusCodesToRetry: [[100, 199], [400, 499], [500, 599]],
				    backoffType       : 'exponential',
				    onRetryAttempt    : err => {
					    const cfg = rax.getConfig(err);
					    logger.error('analytics/conversations/details/jobs FAIL with error: ' + err.response.status + ' Retry attempt #' + cfg.currentRetryAttempt);
				    }
			    }
		    };

		    let calls = [];

		    rax.attach();
		    var response = await axios(options).catch(function (error) {

			    logger.error(error.response.status + " - " + error.response.statusText);
		    });

		    if (response.data.jobId) {

			    var jobID = response.data.jobId;
			    logger.warn("jobID => ", jobID);

			    options = {
				    method   : 'GET',
				    url      : process.env.URLPETICION + 'analytics/conversations/details/jobs/' + jobID,
				    headers  : {
					    'Authorization': token.token_type + ' ' + token.access_token
				    },
				    raxConfig: {
					    retry             : 3,
					    noResponseRetries : 2,
					    retryDelay        : 1000,
					    httpMethodsToRetry: ['GET', 'HEAD', 'OPTIONS', 'DELETE', 'PUT', 'POST'],
					    statusCodesToRetry: [[100, 199], [400, 499], [500, 599]],
					    backoffType       : 'exponential',
					    onRetryAttempt    : err => {
						    const cfg = rax.getConfig(err);
						    logger.error('analytics/conversations/details/jobs/' + jobID + ' FAIL with error: ' + err.response.status + ' Retry attempt #' + cfg.currentRetryAttempt);
					    }
				    }
			    };

			    var fulFilled = false;
			    while (!fulFilled) {

				    await axios(options).then(function (response) {

					    if (response.data.state === "FULFILLED") {

						    logger.warn("Job is FULFILLED");
						    fulFilled = true;
					    }
					    else {

						    logger.warn("Waiting for FULFILLED");
						    return Tools.sleep(1000);
					    }

				    }).catch(function (error) {

					    logger.error(error.response.status + " - " + error.response.statusText);
				    });
			    }
		    }
		    else {
			    return null;
		    }

		    var haveCursor = true;
		    var cursor     = null;

		    while (haveCursor) {
			    var cursorValue = (!cursor) ? '' : '?cursor=' + cursor;
			    options         = {
				    method   : 'GET',
				    url      : process.env.URLPETICION + 'analytics/conversations/details/jobs/' + jobID + '/results' + cursorValue,
				    headers  : {
					    'Authorization': token.token_type + ' ' + token.access_token
				    },
				    raxConfig: {
					    retry             : 3,
					    noResponseRetries : 2,
					    retryDelay        : 1000,
					    httpMethodsToRetry: ['GET', 'HEAD', 'OPTIONS', 'DELETE', 'PUT', 'POST'],
					    statusCodesToRetry: [[100, 199], [400, 499], [500, 599]],
					    backoffType       : 'exponential',
					    onRetryAttempt    : err => {
						    const cfg = rax.getConfig(err);
						    logger.error('analytics/conversations/details/jobs/' + jobID + '/results FAIL with error: ' + err.response.status + ' Retry attempt #' + cfg.currentRetryAttempt);
					    }
				    }
			    };

			    await axios(options).then(function (response) {

				    logger.warn("Fetching new page from job");

				    if (response.data.cursor) {

					    cursor = response.data.cursor;
				    }
				    else {

					    haveCursor = false;
				    }

				    if (response.data.conversations) {
					    calls = calls.concat(response.data.conversations);
				    }

			    }).catch(function (error) {

				    logger.error(error.response.status + " - " + error.response.statusText);
			    });
		    }

		    return calls;
	    },
	    createExcel : async function (excelData, optsParameter) {

		    var wb = new excel.Workbook();
		    var ws = wb.addWorksheet('Reporte', {
			    sheetFormat: {
				    defaultColWidth: 20
			    }
		    });

		    let headerStyle = {
			    alignment: {
				    horizontal: 'center'
			    },
			    font     : {
				    bold: true
			    }
		    };

		    let align = {
			    left     : {
				    alignment: {
					    horizontal: 'left',
					    wrapText  : true
				    }
			    }, center: {
				    alignment: {
					    horizontal: 'center',
					    wrapText  : true
				    }
			    },
			    right    : {
				    alignment: {
					    horizontal: 'right',
					    wrapText  : true
				    }
			    }
		    };

		    var style = wb.createStyle({
			    font        : {
				    color: 'black',
				    size : 14
			    },
			    border      : {
				    left   : {
					    style: 'thin',
					    color: 'black'
				    },
				    right  : {
					    style: 'thin',
					    color: 'black'
				    },
				    top    : {
					    style: 'thin',
					    color: 'black'
				    },
				    bottom : {
					    style: 'thin',
					    color: 'black'
				    },
				    outline: false
			    },
			    numberFormat: '#######; (#######); 0'
		    });

		    ws.addImage({
			    path    : path.join(process.cwd(), '/WebInterfaceReportes/assets/images/posadas.png'),
			    type    : 'picture',
			    position: {
				    type: 'twoCellAnchor',
				    from: {
					    col   : 1,
					    colOff: 0,
					    row   : 1,
					    rowOff: 0
				    },
				    to  : {
					    col   : 4,
					    colOff: 0,
					    row   : 4,
					    rowOff: 0
				    }
			    }
		    });

		    ws.cell(1, 1, 3, 3, true).style(style).style({font: {bold: true}}).style({alignment: {horizontal: 'center'}});

		    ws.cell(1, 4).string("Fecha Inicio: " + moment(optsParameter.startDate).format("MM/DD/YYYY")).style(style).style({font: {bold: true}});
		    ws.cell(2, 4).string("Fecha Termino: " + moment(optsParameter.finalDate).format("MM/DD/YYYY")).style(style).style({font: {bold: true}});
		    ws.cell(3, 4).string("Queue: " + opts.searchData.queueName).style(style).style({font: {bold: true}});

		    ws.column(1).setWidth(13);
		    ws.column(2).setWidth(12);
		    ws.column(3).setWidth(16);
		    ws.column(4).setWidth(18);
		    ws.column(5).setWidth(19);
		    ws.column(6).setWidth(19);
		    ws.column(7).setWidth(19);
		    ws.column(8).setWidth(19);
		    ws.column(9).setWidth(19);
		    ws.column(10).setWidth(19);
		    ws.column(11).setWidth(19);
		    ws.column(12).setWidth(19);
		    ws.column(13).setWidth(19);
		    ws.column(14).setWidth(19);
		    ws.column(15).setWidth(21);
		    ws.column(16).setWidth(21);
		    ws.column(17).setWidth(14);

		    ws.cell(5, 1).string("Fecha").style(style).style(headerStyle);
		    ws.cell(5, 2).string("Skill").style(style).style(headerStyle);
		    ws.cell(5, 3).string("Llamadas ACD").style(style).style(headerStyle);
		    ws.cell(5, 4).string("Llamadas aban.").style(style).style(headerStyle);
		    ws.cell(5, 5).string("ABN RING CALLS").style(style).style(headerStyle);
		    ws.cell(5, 6).string("Llamadas aban.1").style(style).style(headerStyle);
		    ws.cell(5, 7).string("Llamadas aban.2").style(style).style(headerStyle);
		    ws.cell(5, 8).string("Llamadas aban.3").style(style).style(headerStyle);
		    ws.cell(5, 9).string("Llamadas aban.4").style(style).style(headerStyle);
		    ws.cell(5, 10).string("Llamadas aban.5").style(style).style(headerStyle);
		    ws.cell(5, 11).string("Llamadas aban.6").style(style).style(headerStyle);
		    ws.cell(5, 12).string("Llamadas aban.7").style(style).style(headerStyle);
		    ws.cell(5, 13).string("Llamadas aban.8").style(style).style(headerStyle);
		    ws.cell(5, 14).string("Llamadas aban.9").style(style).style(headerStyle);
		    ws.cell(5, 15).string("Llamadas aban.10").style(style).style(headerStyle);
		    ws.cell(5, 16).string("HOLD ABN CALLS").style(style).style(headerStyle);
		    ws.cell(5, 17).string("% Abn. Calls").style(style).style(headerStyle);

		    ws.row(5).freeze();

		    var initialRow = 6;
		    excelData.forEach((rowData, pointer) => {

			    ws.cell(initialRow, 1).string(rowData.timeSlot).style(style).style(align.left);
			    ws.cell(initialRow, 2).string(rowData.queue).style(style).style(align.left);
			    ws.cell(initialRow, 3).number(rowData.acdCalls || 0).style(style).style(align.center);
			    ws.cell(initialRow, 4).number(rowData.nAbandon || 0).style(style).style(align.center);
			    ws.cell(initialRow, 5).number(rowData.nAlertAbandon || 0).style(style).style(align.center);
			    ws.cell(initialRow, 6).number(rowData.nAbandonUnder1 || 0).style(style).style(align.center);
			    ws.cell(initialRow, 7).number(rowData.nAbandonUnder2 || 0).style(style).style(align.center);
			    ws.cell(initialRow, 8).number(rowData.nAbandonUnder3 || 0).style(style).style(align.center);
			    ws.cell(initialRow, 9).number(rowData.nAbandonUnder4 || 0).style(style).style(align.center);
			    ws.cell(initialRow, 10).number(rowData.nAbandonUnder5 || 0).style(style).style(align.center);
			    ws.cell(initialRow, 11).number(rowData.nAbandonUnder6 || 0).style(style).style(align.center);
			    ws.cell(initialRow, 12).number(rowData.nAbandonUnder7 || 0).style(style).style(align.center);
			    ws.cell(initialRow, 13).number(rowData.nAbandonUnder8 || 0).style(style).style(align.center);
			    ws.cell(initialRow, 14).number(rowData.nAbandonUnder9 || 0).style(style).style(align.center);
			    ws.cell(initialRow, 15).number(rowData.nAbandonUnder10 || 0).style(style).style(align.center);
			    ws.cell(initialRow, 16).number(rowData.nAbandonHold || 0).style(style).style(align.center);
			    ws.cell(initialRow, 17).number(rowData.abandonAvg || 0).style(style).style(align.center);
			    initialRow++;
		    });

		    //logger.error(JSON.stringify(excelDataBySlot));
		    try {

			    if (optsParameter.crontab) {

				    wb.write(path.join(process.cwd(), '/Reportes/ReporteConsolidado_' + currentDateFecha + '.xlsx'));
			    }
			    else {

				    /***
				     * Check if the path for report exists, if not create it
				     */
				    let reportStorage = path.join(process.cwd(), "ReportStorage", optsParameter.ownerId, "Reporte2");
				    if (!fs.existsSync(reportStorage)) {
					    fs.mkdirSync(reportStorage, {recursive: true});
				    }

				    /***
				     * Check if filename already exists, if yes, delete it
				     */
				    fs.unlink(path.join(reportStorage, optsParameter.fileName), function (err) {
					    if (err && err.code === 'ENOENT') {
					    }
					    else if (err) {
					    }
					    else {
						    logger.info(path.join(reportStorage, optsParameter.fileName) + ', already exits, remove it');
					    }
				    });

				    /***
				     * Write report into disk
				     */
				    logger.info(path.join(reportStorage, optsParameter.fileName));

				    wb.write(path.join(reportStorage, optsParameter.fileName));
				    logger.info('Report finished');
			    }

		    }
		    catch (error) {

			    logger.error(error);
		    }
	    }
    }
;
module.exports = Reporte2;

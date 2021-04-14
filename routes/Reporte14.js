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

var Reporte14  = {

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
				    let fileName = 'report14_job_' + queueObject.queueId + '.json';
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

			    for (const timeSlot of timeSlots) {

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

					    let fileName = 'report14_job_' + queueObject.queueId + '.json';
					    calls = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'log', fileName), 'utf8'));

					    let startOfTimeSlot = timeSlot.split("/")[0];
					    let endOfTimeSlot   = timeSlot.split("/")[1];

					    let reportStructure = {
						    queue          : queueName,
						    timeSlot       : moment("2021-01-01 " + startOfTimeSlot).tz("America/Mexico_City").format("HH:mm a"),
						    tConnectedTime : 0,
						    tTalkComplete  : 0,
						    tAcdAvg        : 0,
						    tAbandonAvg    : 0,
						    tAlertAvg      : 0,
						    maxStaffed     : 0,
						    nReceived      : 0,
						    acdCalls       : 0,
						    nAbandonUnder10: 0,
						    nOffered       : 0,
						    nAnswerUnder20 : 0,
						    serviceLevel   : 0,
						    tHoldComplete  : 0,
						    nFlowOut       : 0,
						    tHoldAvg       : 0,
						    tTalkAvg       : 0,
						    nAlertAbandon  : 0
					    };

					    let acdCallsCounter        = 0;
					    let tTalkCompleteCounter   = 0;
					    let tAcdCounter            = 0;
					    let tAbandonCounter        = 0;
					    let nAbandonCounter        = 0;
					    let nAbandonUnder10Counter = 0;
					    let nAnswerUnder20Counter  = 0;
					    let nOfferedCounter        = 0;
					    let nHoldCompleteCounter   = 0;
					    let tHoldCompleteCounter   = 0;
					    let tAlertCounter          = 0;
					    let maxStaffedCounter      = 0;

					    for (const dayInterval of dayIntervals) {

						    let intervalRegistersExpression = jsonata("$[$toMillis(conversationStart) >= $toMillis('" + dayInterval + "T" + startOfTimeSlot + "Z') and $toMillis(conversationStart) <= $toMillis('" + dayInterval + "T" + endOfTimeSlot + "Z')]");
						    let intervalRegisters           = intervalRegistersExpression.evaluate(calls);

						    let acdCallsExpression = jsonata("$count(participants[purpose='agent'].sessions.metrics[$.'name' = 'tTalkComplete'].($.'value'))");
						    let acdCalls           = acdCallsExpression.evaluate(intervalRegisters);
						    acdCallsCounter        = acdCallsCounter + (acdCalls || 0);

						    let tTalkCompleteExpression = jsonata("$sum(participants[purpose='agent'].sessions.metrics[$.'name' = 'tTalkComplete'].($.'value'))");
						    let tTalkComplete           = tTalkCompleteExpression.evaluate(intervalRegisters);
						    tTalkCompleteCounter        = tTalkCompleteCounter + (tTalkComplete || 0);

						    let tAcdExpression = jsonata("$sum(participants[purpose='acd'].sessions.metrics[$.'name' = 'tAcd'].($.'value'))");
						    let tAcd           = tAcdExpression.evaluate(intervalRegisters);
						    tAcdCounter        = tAcdCounter + (tAcd || 0);

						    let tAbandonExpression = jsonata("$sum(participants[purpose='acd'].sessions.metrics[$.'name' = 'tAbandon'].($.'value'))");
						    let tAbandon           = tAbandonExpression.evaluate(intervalRegisters);
						    tAbandonCounter        = tAbandonCounter + (tAbandon || 0);

						    let nAbandonExpression = jsonata("$count(participants[purpose='acd'].sessions.metrics[$.'name' = 'tAbandon'].($.'value'))");
						    let nAbandon           = nAbandonExpression.evaluate(intervalRegisters);
						    nAbandonCounter        = nAbandonCounter + (nAbandon || 0);

						    let nOfferedExpression = jsonata("$count(participants[purpose='acd'].sessions.metrics[$.'name' = 'nOffered'].($.'value'))");
						    let nOffered           = nOfferedExpression.evaluate(intervalRegisters);
						    nOfferedCounter        = nOfferedCounter + (nOffered || 0);

						    let nAbandonUnderExpression = jsonata("$count($filter(participants[purpose='acd'].sessions.metrics[$.'name' = 'tAbandon'].($.'value'), function($v, $i){$v < 10000}))");
						    let nAbandonUnder10         = nAbandonUnderExpression.evaluate(intervalRegisters);
						    nAbandonUnder10Counter      = nAbandonUnder10Counter + (nAbandonUnder10 || 0);

						    let nHoldCompleteExpression = jsonata("$count($filter(participants[purpose='agent'].sessions.metrics[$.'name' = 'tHeldComplete'].($.'value'), function($v, $i){$v > 1}))");
						    let nHoldComplete           = nHoldCompleteExpression.evaluate(intervalRegisters);
						    nHoldCompleteCounter        = nHoldCompleteCounter + (nHoldComplete || 0);

						    let nAnswerUnder20Expression = jsonata("$count($filter(participants[purpose='acd'].sessions.metrics[$.'name' = 'tAcd'].($.'value'), function($v, $i){$v < 20000}))");
						    let nAnswerUnder20           = nAnswerUnder20Expression.evaluate(intervalRegisters);
						    nAnswerUnder20Counter        = nAnswerUnder20Counter + (nAnswerUnder20 || 0);

						    let tHoldCompleteExpression = jsonata("$sum(participants[purpose='agent'].sessions.metrics[$.'name' = 'tHeldComplete'].($.'value'))");
						    let tHoldComplete           = tHoldCompleteExpression.evaluate(intervalRegisters);
						    tHoldCompleteCounter        = tHoldCompleteCounter + (tHoldComplete || 0);

						    let tAlertExpression = jsonata("$sum(participants[purpose='agent'].sessions.metrics[$.'name' = 'tAlert'].($.'value'))");
						    let tAlert           = tAlertExpression.evaluate(intervalRegisters);
						    tAlertCounter        = tAlertCounter + (tAlert || 0);

						    let maxStaffedExpression = jsonata("$count($distinct(participants[purpose='agent'].userId))");
						    let maxStaffed           = maxStaffedExpression.evaluate(intervalRegisters);
						    maxStaffedCounter        = maxStaffedCounter + (maxStaffed || 0);

					    }

					    reportStructure.tConnectedTime = 0;

					    reportStructure.tTalkComplete   = (tTalkCompleteCounter / 1000) || 0;
					    reportStructure.tAcdAvg         = ((tAcdCounter / 1000) / nOfferedCounter) || 0;
					    reportStructure.tAbandonAvg     = ((tAbandonCounter / 1000) / nAbandonCounter) || 0;
					    reportStructure.tAlertAvg       = (acdCallsCounter > 0) ? ((tAlertCounter / 1000) / acdCallsCounter) || 0 : 0;
					    reportStructure.maxStaffed      = maxStaffedCounter;
					    reportStructure.nReceived       = nOfferedCounter;
					    reportStructure.acdCalls        = acdCallsCounter;
					    reportStructure.tAcd            = (tAcdCounter / 1000) || 0;
					    reportStructure.nAbandonUnder10 = nAbandonUnder10Counter;
					    reportStructure.nOffered        = nOfferedCounter;
					    reportStructure.nAnswerUnder20  = nAnswerUnder20Counter;
					    reportStructure.serviceLevel    = 0;
					    reportStructure.tHoldComplete   = (tHoldCompleteCounter / 1000) || 0;
					    reportStructure.nFlowOut        = 0;
					    reportStructure.tHoldAvg        = ((tHoldCompleteCounter / 1000) / nHoldCompleteCounter) || 0;
					    reportStructure.tTalkAvg        = (acdCallsCounter > 0) ? ((tAcdCounter / 1000) / acdCallsCounter) || 0 : 0;
					    reportStructure.nAlertAbandon   = 0;

					    /*
					     reportStructure.nAbandon        = nAbandonCounter;
					     reportStructure.tAbandon        = tAbandonCounter;
					     reportStructure.nHoldComplete   = nHoldCompleteCounter;
					     reportStructure.tAlert          = tAlertCounter;
					     */

					    excelData.push(reportStructure);

					    fs.unlink(path.join(process.cwd(), 'log', fileName), function (err) {

						    if (err && err.code === 'ENOENT') {
						    }
						    else if (err) {
						    }
					    });
				    }
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

		    ws.column(1).setWidth(11);
		    ws.column(2).setWidth(11);
		    ws.column(3).setWidth(34);
		    ws.column(4).setWidth(29);
		    ws.column(5).setWidth(30);
		    ws.column(6).setWidth(28);
		    ws.column(7).setWidth(9);
		    ws.column(8).setWidth(16);
		    ws.column(9).setWidth(22);
		    ws.column(10).setWidth(25);
		    ws.column(11).setWidth(23);
		    ws.column(12).setWidth(18);
		    ws.column(13).setWidth(32);
		    ws.column(14).setWidth(22);
		    ws.column(15).setWidth(20);
		    ws.column(16).setWidth(11);
		    ws.column(17).setWidth(30);
		    ws.column(18).setWidth(34);
		    ws.column(19).setWidth(19);

		    ws.cell(5, 1).string("Skill").style(style).style(headerStyle);
		    ws.cell(5, 2).string("Time").style(style).style(headerStyle);
		    ws.cell(5, 3).string("Tiempo Total Conectado al Skill").style(style).style(headerStyle);
		    ws.cell(5, 4).string("Tiempo Total con Llamada").style(style).style(headerStyle);
		    ws.cell(5, 5).string("Duracion Promedio de ACD").style(style).style(headerStyle);
		    ws.cell(5, 6).string("Tiempo Promedio de ABN").style(style).style(headerStyle);
		    ws.cell(5, 7).string("ASA").style(style).style(headerStyle);
		    ws.cell(5, 8).string("MAXSTAFFED").style(style).style(headerStyle);
		    ws.cell(5, 9).string("Llamadas Recibidas").style(style).style(headerStyle);
		    ws.cell(5, 10).string("Llamadas Contestadas").style(style).style(headerStyle);
		    ws.cell(5, 11).string("Detalle ABN < 10seg.").style(style).style(headerStyle);
		    ws.cell(5, 12).string("Tráfico Ofrecido").style(style).style(headerStyle);
		    ws.cell(5, 13).string("Llamadas Contestadas 20seg.").style(style).style(headerStyle);
		    ws.cell(5, 14).string("% Nivel de Servicio").style(style).style(headerStyle);
		    ws.cell(5, 15).string("Tiempo de reten.").style(style).style(headerStyle);
		    ws.cell(5, 16).string("Flow Out").style(style).style(headerStyle);
		    ws.cell(5, 17).string("Duración Promedio de Hold").style(style).style(headerStyle);
		    ws.cell(5, 18).string("Duración Promedio de Llamada").style(style).style(headerStyle);
		    ws.cell(5, 19).string("ABN RING CALLS").style(style).style(headerStyle);

		    ws.row(5).freeze();

		    var initialRow = 6;
		    excelData.forEach((rowData, pointer) => {

			    ws.cell(initialRow, 1).string(rowData.queue).style(style).style(align.left);
			    ws.cell(initialRow, 2).string(rowData.timeSlot).style(style).style(align.left);
			    ws.cell(initialRow, 3).number(rowData.tConnectedTime || 0).style(style).style(align.center);
			    ws.cell(initialRow, 4).number(rowData.tTalkComplete || 0).style(style).style(align.center);
			    ws.cell(initialRow, 5).number(rowData.tAcdAvg || 0).style(style).style(align.center);
			    ws.cell(initialRow, 6).number(rowData.tAbandonAvg || 0).style(style).style(align.center);
			    ws.cell(initialRow, 7).number(rowData.tAlertAvg || 0).style(style).style(align.center);
			    ws.cell(initialRow, 8).number(rowData.maxStaffed || 0).style(style).style(align.center);
			    ws.cell(initialRow, 9).number(rowData.nReceived || 0).style(style).style(align.center);
			    ws.cell(initialRow, 10).number(rowData.acdCalls || 0).style(style).style(align.center);
			    ws.cell(initialRow, 11).number(rowData.nAbandonUnder10 || 0).style(style).style(align.center);
			    ws.cell(initialRow, 12).number(rowData.nOffered || 0).style(style).style(align.center);
			    ws.cell(initialRow, 13).number(rowData.nAnswerUnder20 || 0).style(style).style(align.center);
			    ws.cell(initialRow, 14).number(rowData.serviceLevel || 0).style(style).style(align.center);
			    ws.cell(initialRow, 15).number(rowData.tHoldComplete || 0).style(style).style(align.center);
			    ws.cell(initialRow, 16).number(rowData.nFlowOut || 0).style(style).style(align.center);
			    ws.cell(initialRow, 17).number(rowData.tHoldAvg || 0).style(style).style(align.center);
			    ws.cell(initialRow, 18).number(rowData.tTalkAvg || 0).style(style).style(align.center);
			    ws.cell(initialRow, 19).number(rowData.nAlertAbandon || 0).style(style).style(align.center);
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
				    let reportStorage = path.join(process.cwd(), "ReportStorage", optsParameter.ownerId, "Reporte14");
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
module.exports = Reporte14;

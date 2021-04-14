const Agents                 = require("../models/Agents");
const Groups                 = require("../models/Groups");
const Queues                 = require("../models/Queues");
const logger                 = require("./Logger");
const Token                  = require("./Token");
//const ProcessesModel = require("../models/Processes");
const DownloadProcessesModel = require("../models/DownloadProcesses");
const DeleteProcessesModel   = require("../models/DeleteProcesses");
const DeleteCallsModel       = require("../models/DeletedCalls");
const express                = require('express');
const moment                 = require('moment');
const fs                     = require('fs');
const path                   = require('path');
const router                 = express.Router();

const Reporte1  = require("./Reporte1");
const Reporte2  = require("./Reporte2");
const Reporte10 = require("./Reporte10");
const Reporte14 = require("./Reporte14");
const Reporte19 = require("./Reporte19");
const Reporte20 = require("./Reporte20");
const Reporte22 = require("./Reporte22");

function validatePeriod(req) {

	/***
	 * Validate we receive almost 2 parameters (startDate and finalDate)
	 */
	if (Object.keys(req.body).length < 2) {

		return {
			sucess : false,
			code   : 503,
			message: 'Debe enviar 2 parametros obligatorios: Fecha Inicial y Fecha Final, ambos con formato: yyyy-MM-dd HH:mm, ejemplo: 2021-01-23 17:05'
		};
	}

	/***
	 * Validate one of the parameters called startDate and came in correct format
	 */
	if (req.body.startDate) {

		if (!moment(req.body.startDate, "YYYY-MM-DD HH:mm", true).isValid()) {

			//res.writeHead(503, {'Content-Type': 'text/html'});
			//res.end('El par&aacute;metro <strong>startDate</strong> debe incluirse con formato: yyyy-MM-dd HH:mm, ejemplo: 2021-01-23 17:05');
			return {
				sucess : false,
				code   : 503,
				message: 'El par&aacute;metro <strong>Fecha Inicial</strong> debe incluirse con formato: yyyy-MM-dd HH:mm, ejemplo: 2021-01-23 17:05'
			};
		}
	}
	else {

		return {
			sucess : false,
			code   : 503,
			message: 'No se encuentra el par&aacute;metro <strong>Fecha Inicial</strong> debe incluirse con formato: yyyy-MM-dd HH:mm, ejemplo: 2021-01-23 17:05'
		};
	}

	/***
	 * Validate one of the parameters called finalDate and came in correct format
	 */
	if (req.body.finalDate) {

		if (!moment(req.body.finalDate, "YYYY-MM-DD HH:mm", true).isValid()) {

			return {
				sucess : false,
				code   : 503,
				message: 'El par&aacute;metro <strong>Fecha Final</strong> debe incluirse con formato: yyyy-MM-dd HH:mm, ejemplo: 2021-01-23 17:05'
			};
		}
	}
	else {

		return {
			sucess : false,
			code   : 503,
			message: 'No se encuentra el par&aacute;metro <strong>Fecha Final</strong> debe incluirse con formato: yyyy-MM-dd HH:mm, ejemplo: 2021-01-23 17:05'
		};
	}

	var startDate = moment(req.body.startDate, "YYYY-MM-DD HH:mm", true).tz("America/Mexico_City");
	var finalDate = moment(req.body.finalDate, "YYYY-MM-DD HH:mm", true).tz("America/Mexico_City");

	if (!startDate.isBefore(finalDate, 'seconds')) {

		return {
			sucess : false,
			code   : 503,
			message: 'El par&aacute;metro <strong>Fecha Final</strong> debe de ser mayor a la fecha de Fecha Inicial'
		};
	}

	return {
		success  : true,
		code     : 202,
		startDate: startDate,
		finalDate: finalDate
	};
}

router.post('/ReportList', async function (req, res) {

	var fileList = [];
	fs.readdirSync('./Reportes').forEach(file => {
		if (file.startsWith(req.body.reportFilter)) {
			var fileParts          = file.replace(".xlsx", "").split("_");
			var creationDateString = fs.statSync(path.join('./Reportes', file));
			var creationDate       = moment(creationDateString.birthtime);
			var fileDetail         = {
				filename    : file,
				creationDate: creationDate.format("YYYY-MM-DD HH:mm"),
				reportDate  : fileParts[2]
			};
			fileList.push(fileDetail);
		}
	});
	res.status(200).send(fileList);
});

router.get('/AgentList', async function (req, res) {

	try {

		await Agents.find({"documentName": 'AgentList'}).then(function (response) {

			if (typeof response === 'undefined') {

				console.log("undefined!!!!");
				res.status(200).send({});
			}

			var agents = response[0].agents;
			res.status(200).send(agents);

		}).catch(function (error) {

			logger.error("Error on /AgentList ", error);
			res.status(200).send({});
		});
	}
	catch (e) {

		logger.error("Error on /AgentList ", e);
		res.status(200).send({});
	}

});

router.get('/GroupList', async function (req, res) {

	try {

		await Groups.find({"documentName": 'GroupList'}).then(function (response) {

			if (typeof response === 'undefined') {

				console.log("undefined!!!!");
				res.status(200).send({});
			}

			var groups = response[0].groups;
			res.status(200).send(groups);

		}).catch(function (error) {

			logger.error("Error on /GroupsList ", error);
			res.status(200).send({});
		});
	}
	catch (e) {

		logger.error("Error on /GroupsList ", e);
		res.status(200).send({});
	}

});

router.get('/QueueList', async function (req, res) {

	try {

		await Queues.find({"documentName": 'QueueList'}).then(function (response) {

			if (typeof response === 'undefined') {

				console.log("undefined!!!!");
				res.status(200).send({});
			}

			var queues = response[0].queues;
			res.status(200).send(queues);

		}).catch(function (error) {

			logger.error("Error on /QueueList ", error);
			res.status(200).send({});
		});
	}
	catch (e) {

		logger.error("Error on /QueueList ", e);
		res.status(200).send({});
	}

});

router.post('/Reporte', async function (req, res) {

	/***
	 * Generate token to use thru Genesys API request
	 */
	var tokenObj = await Token.createToken();

	/***
	 * Validate HTTP Request data about dates range for report
	 */
	var validRequest = validatePeriod(req);
	if (!validRequest.success) {

		logger.error("Reporte[" + req.body.reportId + "] => petición invalida, " + req);
		res.status(503).send({
			success: false,
			message: validRequest.message
		});
		return;
	}

	/*req.body.reportId = parseInt(req.body.reportId);
	 req.body.crontab = (req.body.crontab === 'true');*/

	var startDateFileName = validRequest.startDate.format("YYYYMMDD[_]HHmm");
	var finalDateFileName = validRequest.finalDate.format("YYYYMMDD[_]HHmm");
	var fileName          = "Reporte_" + req.body.reportId + "_" + startDateFileName + "_" + finalDateFileName + ".xlsx";

	opts = {
		startDate : validRequest.startDate.format("YYYY-MM-DD[T]HH:mm:ss.000[Z]"),
		finalDate : validRequest.finalDate.format("YYYY-MM-DD[T]HH:mm:ss.000[Z]"),
		searchType: req.body.searchType,
		searchData: req.body.searchData,
		ownerId   : req.body.ownerId,
		fileName  : fileName,
		crontab   : false
	};

	res.status(200).send({
		success: true,
		message: "Reporte en proceso de generaci&ocute;n"
	});

	switch (req.body.reportId) {

		case 1:
			await Reporte1.createReport(tokenObj, opts);
			break;
		case 2:
			await Reporte2.createReport(tokenObj, opts);
			break;
		case 10:
			await Reporte10.createReport(tokenObj, opts);
			break;
		case 14:
			await Reporte14.createReport(tokenObj, opts);
			break;
		case 19:
			await Reporte19.createReport(tokenObj, opts);
			break;
		case 20:
			await Reporte20.createReport(tokenObj, opts);
			console.log(req.body.searchData);
			break;
		case 22:
			await Reporte22.createReport(tokenObj, opts);
			break;
		default:
			break;
	}

	req.app.io.to(req.body.roomUUID).emit('reporte_' + req.body.reportId, {
		filename: '/ReportStorage/' + req.body.ownerId + '/Reporte' + req.body.reportId + '/' + fileName
	});

	console.log('/ReportStorage/' + req.body.ownerId + '/Reporte' + req.body.reportId + '/' + fileName);

});

router.post('/DownloadProcesses', function (req, res) {
	logger.info("DownloadProcesses => Inicio petición");

	var downloadProcesses = new DownloadProcessesModel();

	var params                           = req.body;
	downloadProcesses.name               = params.name;
	downloadProcesses.created_at         = params.created_at;
	downloadProcesses.status             = params.status;
	downloadProcesses.user               = params.user;
	downloadProcesses.download_directory = params.download_directory;
	downloadProcesses.filters            = params.filters;
	downloadProcesses.rename_order       = params.rename_order;
	downloadProcesses.schedule           = params.schedule;
	downloadProcesses.last_run_time      = params.last_run_time;

	logger.info("Params" + downloadProcesses);

	downloadProcesses.save((err, projectStored) => {
		if (err) {
			return res.status(500).send({message: 'Error al guardar el documento ' + err});
		}

		if (!projectStored) {
			return res.status(404).send({message: 'No se ha podido guardar el projecto.'});
		}

		logger.info("Response" + projectStored);
		return res.status(200).send(projectStored);

	});
});

router.get('/ProcessesDownloadList/:id?', async function (req, res) {
	logger.info("ProcessesDownloadList => Inicio petición");
	var processId = req.params.id;
	console.log(processId);

	if (processId != null) {
		console.log('find by id');
		DownloadProcessesModel.findById(processId, (err, processIdList) => {
			console.log(err);
			if (err) {
				return res.status(500).send({message: 'No hay procesos guardados con ese id'});
			}
			if (!processIdList) {
				return res.status(404).send({message: 'No se puede completar su petición'});
			}
			return res.status(200).send(processIdList);
		});
	}
	else {
		console.log('find');
		DownloadProcessesModel.find((err, processList) => {
			console.log(err);
			if (err) {
				return res.status(500).send({message: 'No hay procesos guardados'});
			}
			if (!processList) {
				return res.status(404).send({message: 'No se puede completar su petición'});
			}
			return res.status(200).send(processList);
		});
	}

});

router.get('/ProcessesDeleteList/:id?', async function (req, res) {
	logger.info("ProcessesDeleteList => Inicio petición");
	var processId = req.params.id;
	console.log(processId);

	if (processId != null) {
		console.log('find by id');
		DeleteProcessesModel.findById(processId, (err, processIdList) => {
			console.log(err);
			if (err) {
				return res.status(500).send({message: 'No hay procesos guardados con ese id'});
			}
			if (!processIdList) {
				return res.status(404).send({message: 'No se puede completar su petición'});
			}
			return res.status(200).send(processIdList);
		});
	}
	else {
		console.log('find');
		DeleteProcessesModel.find((err, processList) => {
			console.log(err);
			if (err) {
				return res.status(500).send({message: 'No hay procesos guardados'});
			}
			if (!processList) {
				return res.status(404).send({message: 'No se puede completar su petición'});
			}
			return res.status(200).send(processList);
		});
	}
});

router.post('/DeleteProcesses', function (req, res) {
	logger.info("DeleteProcesses => Inicio petición");

	var deleteProcesses = new DeleteProcessesModel();

	var params                 = req.body;
	deleteProcesses.name       = params.name;
	deleteProcesses.media_type = params.media_type;
	deleteProcesses.created_at = params.created_at;
	deleteProcesses.user       = params.user;
	deleteProcesses.filters    = params.filters;
	deleteProcesses.status     = params.status;
	deleteProcesses.progress   = params.progress;

	logger.info("Params" + deleteProcesses);

	deleteProcesses.save((err, projectStored) => {
		if (err) {
			return res.status(500).send({message: 'Error al guardar el documento ' + err});
		}

		if (!projectStored) {
			return res.status(404).send({message: 'No se ha podido guardar el projecto.'});
		}

		logger.info("Response" + projectStored);
		return res.status(200).send(projectStored);

	});
});

router.put('/CancelProcesses/:id', async function (req, res) {
	logger.info("CancelProcesses => Inicio pretición");

	var processId = req.params.id;
	var update    = req.body;

	console.log(update);
	DeleteProcessesModel.findByIdAndUpdate(processId, update, (err, processesUpdate) => {
		if (err) {
			return res.status(500).send({message: 'Error al cancelar ' + err});
		}
		if (!processesUpdate) {
			return res.status(404).send({message: 'No existe el proceso'});
		}
		return res.status(200).send({processesUpdate});
	});
});

router.put('/EditDownloadProcesses/:id', async function (req, res) {
	logger.info('EditDownloadProcesses => Incio petición...');

	var downloadId = req.params.id;
	var update     = req.body;
	logger.info(update);

	DownloadProcessesModel.findByIdAndUpdate(downloadId, update, (err, downloadUpdate) => {
		if (err) {
			return res.status(500).send({message: 'Error al actulizar ' + err});
		}
		if (!downloadUpdate) {
			return res.status(404).send({message: 'No existe el proceso'});
		}
		return res.status(200).send(downloadUpdate);
	});
});

router.put('/DeleteDownloadProcesses/:id', async function (req, res) {
	logger.info("DeleteDownloadProcesses => Inicio pretición");

	var processId = req.params.id;
	var update    = req.body;

	console.log(update);
	DownloadProcessesModel.findByIdAndDelete(processId, (err, processesUpdate) => {
		if (err) {
			return res.status(500).send({message: 'Error al eliminar ' + err});
		}
		if (!processesUpdate) {
			return res.status(404).send({message: 'No existe el proceso'});
		}
		return res.status(200).send({processesUpdate});
	});
});

router.get('/DeletedCallsList/:id', async function (req, res) {
	logger.info("DeletedCallsList => Inicio petición");
	var processId = req.params.id;
	console.log(processId);

	console.log('find');
	DeleteCallsModel.find({process: processId}, (err, deletedCalls) => {
		console.log(err);
		if (err) {
			return res.status(500).send({message: 'No hay llamadas guardadas'});
		}
		if (!deletedCalls) {
			return res.status(404).send({message: 'No se puede completar su petición'});
		}
		return res.status(200).send(deletedCalls);
	});

});

router.post('/ReporteEPA', async function (req, res) {

	logger.info("ReporteEPA => inicio peticion");

	/***
	 * Validate HTTP Request data about dates range for report
	 */
	var validRequest = validatePeriod(req);
	if (!validRequest.success) {

		logger.error("ReporteEPA => petición invalida, " + req);
		res.status(503).send({
			success: false,
			message: validRequest.message
		});
		return;
	}

	var startDateFileName = validRequest.startDate.format("YYYYMMDD");
	var finalDateFileName = validRequest.finalDate.format("YYYYMMDD");
	var fileName          = "ReporteEPA_Custom_" + startDateFileName + "_" + finalDateFileName + ".xlsx";

	opts = {
		startDate: validRequest.startDate.format("YYYY-MM-DD"),
		finalDate: validRequest.finalDate.format("YYYY-MM-DD"),
		fileName : fileName,
		crontab  : false
	};

	res.status(200).send({
		success: true,
		message: "Reporte en proceso de generaci&ocute;n"
	});

	await ReporteEPA.createReport(opts);

	req.app.io.to(req.body.roomUUID).emit('epa_response', {
		filename: '/Reportes/' + fileName
	});

	logger.info("ReporteEPA => fin peticion");

});

router.post('/ReporteWebChat', async function (req, res) {

	logger.info("ReporteWebChat => inicio peticion");

	/***
	 * Validate HTTP Request data about dates range for report
	 */
	var validRequest = validatePeriod(req);
	if (!validRequest.success) {

		logger.error("ReporteWebChat => petición invalida, " + req);
		res.status(503).send({
			success: false,
			message: validRequest.message
		});
		return;
	}

	var startDateFileName = validRequest.startDate.format("YYYYMMDD");
	var finalDateFileName = validRequest.finalDate.format("YYYYMMDD");
	var fileName          = "ReporteWebChat_Custom_" + startDateFileName + "_" + finalDateFileName + ".xlsx";

	opts = {
		startDate: validRequest.startDate.format("YYYY-MM-DD"),
		finalDate: validRequest.finalDate.format("YYYY-MM-DD"),
		fileName : fileName,
		crontab  : false
	};

	res.status(200).send({
		success: true,
		message: "Reporte en proceso de generaci&ocute;n"
	});

	await ReporteWebChat.createReport(opts);

	req.app.io.to(req.body.roomUUID).emit('webchat_response', {
		filename: '/Reportes/' + fileName
	});

	logger.info("ReporteWhatsApp => fin peticion");

});

router.post('/ReporteWhatsApp', async function (req, res) {

	logger.info("ReporteWebChat => inicio peticion");

	/***
	 * Validate HTTP Request data about dates range for report
	 */
	var validRequest = validatePeriod(req);
	if (!validRequest.success) {

		logger.error("ReporteWhatsApp => petición invalida, " + req);
		res.status(503).send({
			success: false,
			message: validRequest.message
		});
		return;
	}

	var startDateFileName = validRequest.startDate.format("YYYYMMDD");
	var finalDateFileName = validRequest.finalDate.format("YYYYMMDD");
	var fileName          = "ReporteWhatsApp_Custom_" + startDateFileName + "_" + finalDateFileName + ".xlsx";

	opts = {
		startDate: validRequest.startDate.format("YYYY-MM-DD"),
		finalDate: validRequest.finalDate.format("YYYY-MM-DD"),
		fileName : fileName,
		crontab  : false
	};

	res.status(200).send({
		success: true,
		message: "Reporte en proceso de generaci&ocute;n"
	});

	await ReporteWhatsApp.createReport(opts);

	req.app.io.to(req.body.roomUUID).emit('whatsapp_response', {
		filename: '/Reportes/' + fileName
	});

	logger.info("ReporteWhatsApp => fin peticion");

});

router.get('/WebReports', async function (req, res) {

	res.sendFile(path.join(process.cwd() + '/WebInterfaceReportes/index.html'));
});

module.exports = router;

const logger  = require("./Logger");
const express = require('express');
const moment  = require('moment');
const fs      = require('fs');
const path    = require('path');
const router  = express.Router();

router.use('/WebReports/assets', express.static('WebInterfaceReportes/assets'));
router.use('/ReportStorage', express.static('ReportStorage'));

function validatePeriod(req) {

	/***
	 * Validate we receive almost 2 parameters (startDate and finalDate)
	 */
	if (Object.keys(req.body).length !== 3) {

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

	var startDate = moment(req.body.startDate, "YYYY-MM-DD HH:mm", true);
	var finalDate = moment(req.body.finalDate, "YYYY-MM-DD HH:mm", true);

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

	let userId   = req.body.userId;
	let reportId = req.body.reportId;
	var fileList = [];

	fs.readdirSync(path.join(process.cwd(), 'ReportStorage', userId, 'Reporte' + reportId)).forEach(file => {

		if (file.startsWith('Reporte_' + req.body.reportId)) {
			var fileParts          = file.replace(".xlsx", "").split("_");
			var creationDateString = fs.statSync(path.join(process.cwd(),'ReportStorage', userId, 'Reporte' + reportId, file));

			logger.warn(file, creationDateString);
			var creationDate       = moment(creationDateString.ctime);
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

router.get('/WebReports', async function (req, res) {

	logger.info(req.query);
	if (req.query.reporte) {
		res.sendFile(path.join(process.cwd() + '/WebInterfaceReportes/reporte' + req.query.reporte + '.html'));
	}
	else {
		res.sendFile(path.join(process.cwd() + '/WebInterfaceReportes/index.html'));
	}
});

module.exports = router;

const logger              = require("./routes/Logger");
const Tools               = require("./routes/Tools");
const Agents              = require("./routes/Agents");
const Groups              = require("./routes/Groups");
const Queues              = require("./routes/Queues");
const PresenceDefinitions = require("./routes/PresenceDefinitions");
const WebReports          = require("./routes/WebReports");
const WebRecordings       = require("./routes/WebRecordings");
const WebServices         = require("./routes/WebServices");
const NodeCron            = require('node-cron');
const bodyParser          = require('body-parser');
const mongoose            = require('mongoose');
const express             = require('express');
const moment              = require('moment');
const dotenv              = require('dotenv');
const fs                  = require('fs');
const path                = require('path');

var credentials = {
	ca                : fs.readFileSync(path.join(__dirname, '/certificados/Intermedio_DV_2020.crt')),
	key               : fs.readFileSync(path.join(__dirname, '/certificados/CertSSL2021_.key')),
	cert              : fs.readFileSync(path.join(__dirname, '/certificados/CertSSL2021.cert')),
	requestCert       : false,
	rejectUnauthorized: false
};

var app     = express();
const https = require('https').createServer(credentials, app);
const io    = require('socket.io').listen(https, {pingTimeout: 7000, pingInterval: 3000});

dotenv.config({
	path: path.join(process.cwd(), '.env')
});

/*
 * Configuramos Socket.io para que por cada conexion entrante
 * configure un UUID (enviado por el cliente) para tener persistencia
 *
 * de comunicación por cada navegador
 */

io.on("connection", (socket) => {

	var roomUUID = socket.handshake.query.roomUUID;
	socket.join(roomUUID);
	socket.on("disconnect", () => {
		socket.leave(roomUUID);
	});
});
app.io = io;

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
	next();
});

//app.use(WebServices);
app.use(WebReports);
app.use(WebRecordings);
app.use(WebServices);

//Tools.getSlotsIntervals();
//Tools.getDayIntervals("2021-04-01T15:00:00.000Z", "2021-04-13T16:00:00.000Z");
/*Queues.getQueues();
 Agents.getAgents();
 Groups.getGroups();
 PresenceDefinitions.getPresenceDefinitions();*/

NodeCron.schedule('0 1 * * *', function () {

	logger.info('Running cron: Agents');
	Agents.getAgents();
});

NodeCron.schedule('10 1 * * *', function () {

	logger.info('Running cron: Groups');
	Groups.getAgents();
});

logger.info("terst");

https.listen(process.env.PORT, async () => {

	logger.info('HTTPS Server started [' + process.env.PORT + ']');

	const connectionString = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@${process.env.MONGODB_URL}/${process.env.MONGODB_DATABASE}?readPreference=primary&appname=ReportesEcert&ssl=false`;
	await mongoose.connect(connectionString, {

			useNewUrlParser   : true,
			useUnifiedTopology: true
		})
		.then(() => {

			logger.info('MongoDB connected [' + process.env.MONGODB_URL + '/' + process.env.MONGODB_DATABASE + ']');
		})
		.catch(error => {

			console.log('No se ha logrado conectar a MongoDb :', error);
			process.exit(1);
		});
});

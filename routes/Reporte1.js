const logger                   = require("./Logger");
const GetUsers                 = require("./GetUsersFromGroup");
const AgentsModel              = require("../models/Agents");
const QueuesModel              = require("../models/Queues");
const PresenceDefinitionsModel = require("../models/PresenceDefinitions");
const axios                    = require('axios').default;
const excel                    = require('excel4node');
const moment                   = require('moment');
const fs                       = require('fs');
const path                     = require('path');
const jsonata                  = require('jsonata');
var opts                       = {};

var Reporte1   = {

	createReport: async function (token, optsParameter) {

		opts = optsParameter;
		logger.info(opts);
		logger.info("===== INICIANDO REPORTE =====");

		let extractionDate = opts.startDate + "/" + opts.finalDate;
		logger.info("test", extractionDate);

		let conversationAggregateData = {
			"interval"   : extractionDate,
			"granularity": "P1D",
			"groupBy"    : [
				"queueId",
				"userId"
			],
			"filter"     : {
				"type"      : "and",
				"predicates": [
					{
						"type"     : "dimension",
						"dimension": "userId",
						"operator" : "matches",
						"value"    : ""
					},
					{
						"type"     : "dimension",
						"dimension": "mediaType",
						"operator" : "matches",
						"value"    : "voice"
					}
				]
			},
			"views"      : [],
			"metrics"    : [
				"nBlindTransferred",
				"nConnected",
				"nConsult",
				"nConsultTransferred",
				"nError",
				"nOffered",
				"nOutbound",
				"nOutboundAbandoned",
				"nOutboundAttempted",
				"nOutboundConnected",
				"nOverSla",
				"nStateTransitionError",
				"nTransferred",
				"oExternalMediaCount",
				"oMediaCount",
				"oServiceLevel",
				"oServiceTarget",
				"tAbandon",
				"tAcd",
				"tAcw",
				"tAgentResponseTime",
				"tAlert",
				"tAnswered",
				"tContacting",
				"tDialing",
				"tFlowOut",
				"tHandle",
				"tHeld",
				"tHeldComplete",
				"tIvr",
				"tMonitoring",
				"tNotResponding",
				"tShortAbandon",
				"tTalk",
				"tTalkComplete",
				"tUserResponseTime",
				"tVoicemail",
				"tWait"
			]
		};

		let userAggregateData = {
			"interval"   : extractionDate,
			"granularity": "P1D",
			"groupBy"    : [
				"userId"
			],
			"filter"     : {
				"type"      : "and",
				"predicates": [
					{
						"type"     : "dimension",
						"dimension": "userId",
						"operator" : "matches",
						"value"    : ""
					}
				]
			},
			"metrics"    : [
				"tAgentRoutingStatus",
				"tOrganizationPresence",
				"tSystemPresence"
			]
		};

		var auxPresenceDefinitions       = [];
		var availablePresenceDefinitions = [];
		var staffedPresenceDefinitions   = [];
		var busyPresenceDefinitions      = [];
		var mealPresenceDefinitions      = [];
		var offlinePresenceDefinitions   = [];
		var onqueuePresenceDefinitions   = [];
		var aux01PresenceDefinitions     = [];
		var aux02PresenceDefinitions     = [];
		var aux03PresenceDefinitions     = [];
		var aux04PresenceDefinitions     = [];
		var aux05PresenceDefinitions     = [];
		var aux06PresenceDefinitions     = [];
		var aux07PresenceDefinitions     = [];
		var aux08PresenceDefinitions     = [];
		var aux09PresenceDefinitions     = [];
		var aux10PresenceDefinitions     = [];
		var aux11PresenceDefinitions     = [];
		var aux12PresenceDefinitions     = [];
		var aux13PresenceDefinitions     = [];
		var aux14PresenceDefinitions     = [];

		let searchType = opts.searchType;
		let arrayUsers = [];

		if (opts.searchType === "group") {

			arrayUsers = await GetUsers.getUsers(opts.searchData[0].groupId);
		}
		else {
			arrayUsers = opts.searchData;
		}

		/***
		 * agentName, locationID field extraction
		 */
		try {

			await AgentsModel.find({"documentName": 'AgentList'}).then(function (response) {

				if (typeof response === 'undefined') {

					console.log("undefined!!!!");
				}

				let agentExpression = jsonata("$[id = '" + arrayUsers[0].userId + "']");
				let resultAgent     = agentExpression.evaluate(response[0].agents);

				optsParameter.searchData[0].userName =resultAgent.name + " (" + resultAgent.username + ")";

			}).catch(function (error) {

				logger.error("Error on /AgentList ", error);
			});
		}
		catch (e) {

			logger.error("Error on /AgentList ", e);
		}

		/***
		 * Get presenceDescriptions
		 */
		try {

			await PresenceDefinitionsModel.find({"documentName": 'PresenceDefinitions'}).then(function (response) {

				if (typeof response === 'undefined') {

					console.log("undefined!!!!");
				}

				let presenceDefinitionsExpression = jsonata("$[systemPresence in ['Away','Break','Meeting','Busy','Training','Meal']].id");
				auxPresenceDefinitions            = JSON.parse(JSON.stringify(presenceDefinitionsExpression.evaluate(response[0].presenceDefinitions)));

				presenceDefinitionsExpression = jsonata("$[description in ['Busy']].id");
				busyPresenceDefinitions       = JSON.parse(JSON.stringify(presenceDefinitionsExpression.evaluate(response[0].presenceDefinitions)));

				presenceDefinitionsExpression = jsonata("$[description in ['Meal']].id");
				mealPresenceDefinitions       = JSON.parse(JSON.stringify(presenceDefinitionsExpression.evaluate(response[0].presenceDefinitions)));

				presenceDefinitionsExpression = jsonata("$[description in ['Time in 0']].id");
				aux01PresenceDefinitions      = JSON.parse(JSON.stringify(presenceDefinitionsExpression.evaluate(response[0].presenceDefinitions)));

				presenceDefinitionsExpression = jsonata("$[description in ['Trabajo Administrativo']].id");
				aux02PresenceDefinitions      = JSON.parse(JSON.stringify(presenceDefinitionsExpression.evaluate(response[0].presenceDefinitions)));

				presenceDefinitionsExpression = jsonata("$[description in ['Descanso/Comida']].id");
				aux03PresenceDefinitions      = JSON.parse(JSON.stringify(presenceDefinitionsExpression.evaluate(response[0].presenceDefinitions)));

				presenceDefinitionsExpression = jsonata("$[description in ['Problemas de hardware/software']].id");
				aux04PresenceDefinitions      = JSON.parse(JSON.stringify(presenceDefinitionsExpression.evaluate(response[0].presenceDefinitions)));

				presenceDefinitionsExpression = jsonata("$[description in ['Time in 0']].id");
				aux05PresenceDefinitions      = JSON.parse(JSON.stringify(presenceDefinitionsExpression.evaluate(response[0].presenceDefinitions)));

				presenceDefinitionsExpression = jsonata("$[description in ['Time in 0']].id");
				aux06PresenceDefinitions      = JSON.parse(JSON.stringify(presenceDefinitionsExpression.evaluate(response[0].presenceDefinitions)));

				presenceDefinitionsExpression = jsonata("$[description in ['Coaching/Feedback']].id");
				aux07PresenceDefinitions      = JSON.parse(JSON.stringify(presenceDefinitionsExpression.evaluate(response[0].presenceDefinitions)));

				presenceDefinitionsExpression = jsonata("$[description in ['Capacitación/Examen']].id");
				aux08PresenceDefinitions      = JSON.parse(JSON.stringify(presenceDefinitionsExpression.evaluate(response[0].presenceDefinitions)));

				presenceDefinitionsExpression = jsonata("$[description in ['Término de jornada']].id");
				aux09PresenceDefinitions      = JSON.parse(JSON.stringify(presenceDefinitionsExpression.evaluate(response[0].presenceDefinitions)));

				presenceDefinitionsExpression = jsonata("$[description in ['Consulta a Coordinador']].id");
				aux10PresenceDefinitions      = JSON.parse(JSON.stringify(presenceDefinitionsExpression.evaluate(response[0].presenceDefinitions)));

				presenceDefinitionsExpression = jsonata("$[description in ['Consulta a Capital Humano/Atracc']].id");
				aux11PresenceDefinitions      = JSON.parse(JSON.stringify(presenceDefinitionsExpression.evaluate(response[0].presenceDefinitions)));

				presenceDefinitionsExpression = jsonata("$[description in ['Acta administrativa/Carta compro']].id");
				aux12PresenceDefinitions      = JSON.parse(JSON.stringify(presenceDefinitionsExpression.evaluate(response[0].presenceDefinitions)));

				presenceDefinitionsExpression = jsonata("$[description in ['Asistencia médica']].id");
				aux13PresenceDefinitions      = JSON.parse(JSON.stringify(presenceDefinitionsExpression.evaluate(response[0].presenceDefinitions)));

				presenceDefinitionsExpression = jsonata("$[description in ['Medidas de higiene covid-19']].id");
				aux14PresenceDefinitions      = JSON.parse(JSON.stringify(presenceDefinitionsExpression.evaluate(response[0].presenceDefinitions)));

				presenceDefinitionsExpression = jsonata("$[systemPresence in ['Idle']].id");
				availablePresenceDefinitions  = JSON.parse(JSON.stringify(presenceDefinitionsExpression.evaluate(response[0].presenceDefinitions)));

				presenceDefinitionsExpression = jsonata("$[systemPresence in ['Available']].id");
				staffedPresenceDefinitions    = JSON.parse(JSON.stringify(presenceDefinitionsExpression.evaluate(response[0].presenceDefinitions)));

				presenceDefinitionsExpression = jsonata("$[systemPresence in ['Offline']].id");
				offlinePresenceDefinitions    = JSON.parse(JSON.stringify(presenceDefinitionsExpression.evaluate(response[0].presenceDefinitions)));

				presenceDefinitionsExpression = jsonata("$[systemPresence in ['On Queue']].id");
				onqueuePresenceDefinitions    = JSON.parse(JSON.stringify(presenceDefinitionsExpression.evaluate(response[0].presenceDefinitions)));

				//userSummaryTemplate.agentName  = resultAgent.name;
				//userSummaryTemplate.locationID = resultAgent.username;

			}).catch(function (error) {

				logger.error("Error on /AgentList ", error);
			});
		}
		catch (e) {

			logger.error("Error on /AgentList ", e);
		}

		var excelData = [];
		for (const searchItem of arrayUsers) {

			/***
			 * Configuramos BODY para API de conversations
			 */
			conversationAggregateData.filter.predicates[0].value = searchItem.userId;
			var optionsConversationAggregate = {
				method : 'POST',
				url    : process.env.URLPETICION + 'analytics/conversations/aggregates/query',
				headers: {
					'Authorization': token.token_type + ' ' + token.access_token,
					'Content-Type' : 'application/json'
				},
				data   : conversationAggregateData
			};

			/***
			 * Configuramos BODY para API de users
			 */
			userAggregateData.filter.predicates[0].value = searchItem.userId;
			var optionsUserAggregate = {
				method : 'POST',
				url    : process.env.URLPETICION + 'analytics/users/aggregates/query',
				headers: {
					'Authorization': token.token_type + ' ' + token.access_token,
					'Content-Type' : 'application/json'
				},
				data   : userAggregateData
			};

			try {

				let userAggregateResult = await axios(optionsUserAggregate).catch(function (error) {

					logger.error(error.response.status + " - " + error.response.statusText);
				});

				if (typeof userAggregateResult.data.results[0].data === 'undefined') {

					logger.error("userAggregateResult Axios request ERROR");
					return;
				}

				let conversationAggregateResult = await axios(optionsConversationAggregate).catch(function (error) {

					logger.error(error.response.status + " - " + error.response.statusText);
				});

				if (typeof conversationAggregateResult.data.results === 'undefined') {

					logger.warn("empty conversationAggregateResult Axios response");
				}

				//logger.warn(JSON.stringify(userAggregateResult.data.results[0].data, null, 4));
				for (const intervalData of userAggregateResult.data.results[0].data) {

					/***
					 * Configuramos OBJ para registro en XLSX
					 */
					let userSummaryTemplate = {
						reportDate : null,
						staffedTime: 0,
						auxTime    : 0,
						aux01      : 0,
						aux02      : 0,
						aux03      : 0,
						aux04      : 0,
						campain    : 0,
						followup   : 0,
						aux07      : 0,
						aux08      : 0,
						aux09      : 0,
						aux10      : 0,
						aux11      : 0,
						aux12      : 0,
						aux13      : 0,
						aux14      : 0,
						busy       : 0,
						meal       : 0,
						holdTime   : 0,
						idleTime   : 0,
						ringTime   : 0,
						acdTime    : 0,
						offlineTime: 0,
						onqueueTime: 0
					};

					let currentInterval = intervalData.interval;

					//logger.info(currentInterval);
					userSummaryTemplate.reportDate = moment(currentInterval.split("/")[0], "YYYY-MM-DDTHH:mm:ss.sssZ", true).format("MM/DD/YYYY");

					//logger.info(resultPresenceDefinitions);
					//logger.info(JSON.stringify(intervalData, null, 4));

					/***
					 * staffedTime field extraction
					 */
					let staffedIntervalExpression   = jsonata("metrics.{'metrics': %.metrics[qualifier in " + JSON.stringify(staffedPresenceDefinitions) + " ]}[0].{'total':$sum(metrics.stats.sum)}");
					let staffedUserInterval         = staffedIntervalExpression.evaluate(intervalData);
					userSummaryTemplate.staffedTime = staffedUserInterval.total || 0;

					/***
					 * auxTime field extraction
					 */
					let auxTimeExpression       = jsonata("metrics.{'metrics': %.metrics[qualifier in " + JSON.stringify(auxPresenceDefinitions) + " ]}[0].{'total':$sum(metrics.stats.sum)}");
					let auxTimeInterval         = auxTimeExpression.evaluate(intervalData);
					userSummaryTemplate.auxTime = auxTimeInterval.total || 0;

					/***
					 * Time in 0 field extraction
					 */
					let aux01Expression       = jsonata("metrics.{'metrics': %.metrics[qualifier in " + JSON.stringify(aux01PresenceDefinitions) + " ]}[0].{'total':$sum(metrics.stats.sum)}");
					let aux01Interval         = aux01Expression.evaluate(intervalData);
					userSummaryTemplate.aux01 = aux01Interval.total || 0;

					/***
					 * Trabajo administrativo field extraction
					 */
					let aux02Expression       = jsonata("metrics.{'metrics': %.metrics[qualifier in " + JSON.stringify(aux02PresenceDefinitions) + " ]}[0].{'total':$sum(metrics.stats.sum)}");
					let aux02Interval         = aux02Expression.evaluate(intervalData);
					userSummaryTemplate.aux02 = aux02Interval.total || 0;

					/***
					 * Descanso/Comida field extraction
					 */
					let aux03Expression       = jsonata("metrics.{'metrics': %.metrics[qualifier in " + JSON.stringify(aux03PresenceDefinitions) + " ]}[0].{'total':$sum(metrics.stats.sum)}");
					let aux03Interval         = aux03Expression.evaluate(intervalData);
					userSummaryTemplate.aux03 = aux03Interval.total || 0;

					/***
					 * Problemas de hardware/software field extraction
					 */
					let aux04Expression       = jsonata("metrics.{'metrics': %.metrics[qualifier in " + JSON.stringify(aux04PresenceDefinitions) + " ]}[0].{'total':$sum(metrics.stats.sum)}");
					let aux04Interval         = aux04Expression.evaluate(intervalData);
					userSummaryTemplate.aux04 = aux04Interval.total || 0;

					/***
					 * Coaching/Feedback field extraction
					 */
					let aux07Expression       = jsonata("metrics.{'metrics': %.metrics[qualifier in " + JSON.stringify(aux07PresenceDefinitions) + " ]}[0].{'total':$sum(metrics.stats.sum)}");
					let aux07Interval         = aux07Expression.evaluate(intervalData);
					userSummaryTemplate.aux07 = aux07Interval.total || 0;

					/***
					 * Capacitación/Examen field extraction
					 */
					let aux08Expression       = jsonata("metrics.{'metrics': %.metrics[qualifier in " + JSON.stringify(aux08PresenceDefinitions) + " ]}[0].{'total':$sum(metrics.stats.sum)}");
					let aux08Interval         = aux08Expression.evaluate(intervalData);
					userSummaryTemplate.aux08 = aux08Interval.total || 0;

					/***
					 * Término de jornada field extraction
					 */
					let aux09Expression       = jsonata("metrics.{'metrics': %.metrics[qualifier in " + JSON.stringify(aux09PresenceDefinitions) + " ]}[0].{'total':$sum(metrics.stats.sum)}");
					let aux09Interval         = aux09Expression.evaluate(intervalData);
					userSummaryTemplate.aux09 = aux09Interval.total || 0;

					/***
					 * Consulta a Coordinador field extraction
					 */
					let aux10Expression       = jsonata("metrics.{'metrics': %.metrics[qualifier in " + JSON.stringify(aux10PresenceDefinitions) + " ]}[0].{'total':$sum(metrics.stats.sum)}");
					let aux10Interval         = aux10Expression.evaluate(intervalData);
					userSummaryTemplate.aux10 = aux10Interval.total || 0;

					/***
					 * Consulta a Capital Humano/Atracción de Talento field extraction
					 */
					let aux11Expression       = jsonata("metrics.{'metrics': %.metrics[qualifier in " + JSON.stringify(aux11PresenceDefinitions) + " ]}[0].{'total':$sum(metrics.stats.sum)}");
					let aux11Interval         = aux11Expression.evaluate(intervalData);
					userSummaryTemplate.aux11 = aux11Interval.total || 0;

					/***
					 * Acta administrativa/Carta compromiso field extraction
					 */
					let aux12Expression       = jsonata("metrics.{'metrics': %.metrics[qualifier in " + JSON.stringify(aux12PresenceDefinitions) + " ]}[0].{'total':$sum(metrics.stats.sum)}");
					let aux12Interval         = aux12Expression.evaluate(intervalData);
					userSummaryTemplate.aux12 = aux12Interval.total || 0;

					/***
					 * Asistencia médica field extraction
					 */
					let aux13Expression       = jsonata("metrics.{'metrics': %.metrics[qualifier in " + JSON.stringify(aux13PresenceDefinitions) + " ]}[0].{'total':$sum(metrics.stats.sum)}");
					let aux13Interval         = aux13Expression.evaluate(intervalData);
					userSummaryTemplate.aux13 = aux13Interval.total || 0;

					/***
					 * Medidas de higiene covid-19 field extraction
					 */
					let aux14Expression       = jsonata("metrics.{'metrics': %.metrics[qualifier in " + JSON.stringify(aux14PresenceDefinitions) + " ]}[0].{'total':$sum(metrics.stats.sum)}");
					let aux14Interval         = aux14Expression.evaluate(intervalData);
					userSummaryTemplate.aux14 = aux14Interval.total || 0;

					/***
					 * Medidas de higiene covid-19 field extraction
					 */
					let busyExpression        = jsonata("metrics.{'metrics': %.metrics[qualifier in " + JSON.stringify(busyPresenceDefinitions) + " ]}[0].{'total':$sum(metrics.stats.sum)}");
					let busyInterval          = busyExpression.evaluate(intervalData);
					userSummaryTemplate.aux14 = busyInterval.total || 0;

					/***
					 * Medidas de higiene covid-19 field extraction
					 */
					let mealExpression        = jsonata("metrics.{'metrics': %.metrics[qualifier in " + JSON.stringify(mealPresenceDefinitions) + " ]}[0].{'total':$sum(metrics.stats.sum)}");
					let mealInterval          = mealExpression.evaluate(intervalData);
					userSummaryTemplate.aux14 = mealInterval.total || 0;

					/***
					 * idleTime field extraction
					 */
					let availableIntervalExpression = jsonata("metrics.{'metrics': %.metrics[qualifier in " + JSON.stringify(availablePresenceDefinitions) + " ]}[0].{'total':$sum(metrics.stats.sum)}");
					let availableUserInterval       = availableIntervalExpression.evaluate(intervalData);
					userSummaryTemplate.idleTime    = availableUserInterval.total || 0;

					/***
					 * offlineTime field extraction
					 */
					let offlineIntervalExpression = jsonata("metrics.{'metrics': %.metrics[qualifier in " + JSON.stringify(offlinePresenceDefinitions) + " ]}[0].{'total':$sum(metrics.stats.sum)}");
					let offlineUserInterval       = offlineIntervalExpression.evaluate(intervalData);
					userSummaryTemplate.idleTime  = offlineUserInterval.total || 0;

					/***
					 * offlineTime field extraction
					 */
					let onqueueIntervalExpression   = jsonata("metrics.{'metrics': %.metrics[qualifier in " + JSON.stringify(onqueuePresenceDefinitions) + " ]}[0].{'total':$sum(metrics.stats.sum)}");
					let onqueueUserInterval         = onqueueIntervalExpression.evaluate(intervalData);
					userSummaryTemplate.onqueueTime = onqueueUserInterval.total || 0;

					//logger.info(currentInterval);
					let converstaionIntervalExpression = jsonata("" +
						"results.group[queueId].{" +
						"   'data': %.data[interval = '" + currentInterval + "']" +
						"}"
					);

					var resultConverstaionInterval = converstaionIntervalExpression.evaluate(conversationAggregateResult.data);

					if (typeof resultConverstaionInterval !== 'undefined') {
						/***
						 * acdTime, acdCalls field extraction
						 */
						let acdTimeIntervalExpression = jsonata("" +
							"data.metrics[metric = 'tHandle'].{" +
							"	'time': stats.sum" +
							"}"
						);
						let acdTimeInterval           = acdTimeIntervalExpression.evaluate(resultConverstaionInterval);
						userSummaryTemplate.acdTime   = (typeof acdTimeInterval === 'undefined') ? 0 : (acdTimeInterval.time || 0);

						/***
						 * staffedTime field extraction
						 */
						let holdTimeIntervalExpression = jsonata("" +
							"data.metrics[metric = 'tHeldComplete'].{" +
							"	'time': stats.sum" +
							"}"
						);
						let holdTimeInterval           = holdTimeIntervalExpression.evaluate(resultConverstaionInterval) || {time: 0};
						userSummaryTemplate.holdTime   = (typeof holdTimeInterval === 'undefined') ? 0 : (holdTimeInterval.time || 0);

						/***
						 * staffedTime field extraction
						 */
						let ringTimeIntervalExpression = jsonata("" +
							"data.metrics[metric = 'tAlert'].{" +
							"	'time': stats.sum" +
							"}"
						);
						let ringTimeInterval           = ringTimeIntervalExpression.evaluate(resultConverstaionInterval) || {time: 0};
						userSummaryTemplate.ringTime   = (typeof ringTimeInterval === 'undefined') ? 0 : (ringTimeInterval.time || 0);

						excelData.push(userSummaryTemplate);
					}
					else {
						excelData.push(userSummaryTemplate);
					}
				}

			}
			catch (error) {

				logger.error(error);
			}

			//logger.info(JSON.stringify(data, null, 4));
		}

		//logger.info(JSON.stringify(excelData, null, 4));

		await this.createExcel(excelData, optsParameter);

	},
	createExcel : async function (excelData, optsParameter) {

		var wb = new excel.Workbook();
		var ws = wb.addWorksheet('Consolidado Voz', {
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
					col   : 3,
					colOff: 0,
					row   : 4,
					rowOff: 0
				}
			}
		});

		ws.cell(1, 1, 3, 2, true).style(style).style({font: {bold: true}}).style({alignment: {horizontal: 'center'}});

		let groupValue = (optsParameter.searchType === "group") ? optsParameter.searchData.groupName : optsParameter.searchData[0].userName;

		ws.cell(1, 3).string("Fecha Inicio: " + moment(optsParameter.startDate).format("MM/DD/YYYY")).style(style).style({font: {bold: true}});
		ws.cell(2, 3).string("Fecha Termino: " + moment(optsParameter.finalDate).format("MM/DD/YYYY")).style(style).style({font: {bold: true}});
		ws.cell(3, 3).string("Agente: " + groupValue).style(style).style({font: {bold: true}});

		ws.column(1).setWidth(13);
		ws.column(2).setWidth(23);
		ws.column(3).setWidth(15);
		ws.column(4).setWidth(14);
		ws.column(5).setWidth(25);
		ws.column(6).setWidth(20);
		ws.column(7).setWidth(36);
		ws.column(8).setWidth(17);
		ws.column(9).setWidth(31);
		ws.column(10).setWidth(22);
		ws.column(11).setWidth(24);
		ws.column(12).setWidth(23);
		ws.column(13).setWidth(26);
		ws.column(14).setWidth(37);
		ws.column(15).setWidth(37);
		ws.column(16).setWidth(21);
		ws.column(17).setWidth(31);

		/***
		 * Configuramos OBJ para registro en XLSX
		 */
		let userSummaryTemplate = {
			reportDate : null,
			staffedTime: 0,
			auxTime    : 0,
			aux01      : 0,
			aux02      : 0,
			aux03      : 0,
			aux04      : 0,
			campain    : 0,
			followup   : 0,
			aux07      : 0,
			aux08      : 0,
			aux09      : 0,
			aux10      : 0,
			aux11      : 0,
			aux12      : 0,
			aux13      : 0,
			aux14      : 0,
			busy       : 0,
			meal       : 0,
			holdTime   : 0,
			idleTime   : 0,
			ringTime   : 0,
			acdTime    : 0,
			offlineTime: 0,
			onqueueTime: 0
		};

		ws.cell(5, 1).string("Fecha").style(style).style(headerStyle);
		ws.cell(5, 2).string("Tiempo con personal").style(style).style(headerStyle);
		ws.cell(5, 3).string("Tiempo AUX").style(style).style(headerStyle);
		ws.cell(5, 4).string("Tiempo en 0").style(style).style(headerStyle);
		ws.cell(5, 5).string("Trabajo Administrativo").style(style).style(headerStyle);
		ws.cell(5, 6).string("Descanso/Comida").style(style).style(headerStyle);
		ws.cell(5, 7).string("Problemas de hardware/software").style(style).style(headerStyle);
		ws.cell(5, 8).string("Campaña/Chat").style(style).style(headerStyle);
		ws.cell(5, 9).string("Seguimiento a transacciones").style(style).style(headerStyle);
		ws.cell(5, 10).string("Coaching/Feedback").style(style).style(headerStyle);
		ws.cell(5, 11).string("Capacitación/Examen").style(style).style(headerStyle);
		ws.cell(5, 12).string("Término de jornada").style(style).style(headerStyle);
		ws.cell(5, 13).string("Consulta a Coordinador").style(style).style(headerStyle);
		ws.cell(5, 14).string("Consulta a Capital Humano/Atracc").style(style).style(headerStyle);
		ws.cell(5, 15).string("Acta administrativa/Carta compro").style(style).style(headerStyle);
		ws.cell(5, 16).string("Asistencia médica").style(style).style(headerStyle);
		ws.cell(5, 17).string("Medidas de higiene covid-19").style(style).style(headerStyle);

		let acdTime  = 0;
		let auxTime  = 0;
		let aux01    = 0;
		let aux02    = 0;
		let aux03    = 0;
		let aux04    = 0;
		let aux07    = 0;
		let aux08    = 0;
		let aux09    = 0;
		let aux10    = 0;
		let aux11    = 0;
		let aux12    = 0;
		let aux13    = 0;
		let aux14    = 0;
		let campain  = 0;
		let followup = 0;

		var initialRow = 7;
		excelData.forEach((rowData, pointer) => {

			ws.cell(initialRow, 1).string(rowData.reportDate).style(style).style(align.left);
			ws.cell(initialRow, 2).number(Math.round(rowData.acdTime / 1000)).style(style).style(align.right);
			acdTime = acdTime + (Math.round(rowData.acdTime / 1000) || 0);
			ws.cell(initialRow, 3).number(Math.round(rowData.auxTime / 1000)).style(style).style(align.right);
			auxTime = auxTime + (Math.round(rowData.auxTime / 1000) || 0);
			ws.cell(initialRow, 4).number(Math.round(rowData.aux01 / 1000)).style(style).style(align.right);
			aux01 = aux01 + (Math.round(rowData.aux01 / 1000) || 0);
			ws.cell(initialRow, 5).number(Math.round(rowData.aux02 / 1000)).style(style).style(align.right);
			aux02 = aux02 + (Math.round(rowData.aux02 / 1000) || 0);
			ws.cell(initialRow, 6).number(Math.round(rowData.aux03 / 1000)).style(style).style(align.right);
			aux03 = aux03 + (Math.round(rowData.aux03 / 1000) || 0);
			ws.cell(initialRow, 7).number(Math.round(rowData.aux04 / 1000)).style(style).style(align.right);
			aux04 = aux04 + (Math.round(rowData.aux04 / 1000) || 0);
			ws.cell(initialRow, 8).number(Math.round(rowData.campain / 1000)).style(style).style(align.right);
			campain = campain + (Math.round(rowData.campain / 1000) || 0);
			ws.cell(initialRow, 9).number(Math.round(rowData.followup / 1000)).style(style).style(align.right);
			followup = followup + (Math.round(rowData.followup / 1000) || 0);
			ws.cell(initialRow, 10).number(Math.round(rowData.aux07 / 1000)).style(style).style(align.right);
			aux07 = aux07 + (Math.round(rowData.aux07 / 1000) || 0);
			ws.cell(initialRow, 11).number(Math.round(rowData.aux08 / 1000)).style(style).style(align.right);
			aux08 = aux08 + (Math.round(rowData.aux08 / 1000) || 0);
			ws.cell(initialRow, 12).number(Math.round(rowData.aux09 / 1000)).style(style).style(align.right);
			aux09 = aux09 + (Math.round(rowData.aux09 / 1000) || 0);
			ws.cell(initialRow, 13).number(Math.round(rowData.aux10 / 1000)).style(style).style(align.right);
			aux10 = aux10 + (Math.round(rowData.aux10 / 1000) || 0);
			ws.cell(initialRow, 14).number(Math.round(rowData.aux11 / 1000)).style(style).style(align.right);
			aux11 = aux11 + (Math.round(rowData.aux11 / 1000) || 0);
			ws.cell(initialRow, 15).number(Math.round(rowData.aux12 / 1000)).style(style).style(align.right);
			aux12 = aux12 + (Math.round(rowData.aux12 / 1000) || 0);
			ws.cell(initialRow, 16).number(Math.round(rowData.aux13 / 1000)).style(style).style(align.right);
			aux13 = aux13 + (Math.round(rowData.aux13 / 1000) || 0);
			ws.cell(initialRow, 17).number(Math.round(rowData.aux14 / 1000)).style(style).style(align.right);
			aux14 = aux14 + (Math.round(rowData.aux14 / 1000) || 0);

			initialRow++;
		});

		ws.cell(6, 1).string("Totales").style(style).style(align.left);
		ws.cell(6, 2).number(acdTime).style(style).style(align.right);
		ws.cell(6, 3).number(auxTime).style(style).style(align.right);
		ws.cell(6, 4).number(aux01).style(style).style(align.right);
		ws.cell(6, 5).number(aux02).style(style).style(align.right);
		ws.cell(6, 6).number(aux03).style(style).style(align.right);
		ws.cell(6, 7).number(aux04).style(style).style(align.right);
		ws.cell(6, 8).number(campain).style(style).style(align.right);
		ws.cell(6, 9).number(followup).style(style).style(align.right);
		ws.cell(6, 10).number(aux07).style(style).style(align.right);
		ws.cell(6, 11).number(aux08).style(style).style(align.right);
		ws.cell(6, 12).number(aux09).style(style).style(align.right);
		ws.cell(6, 13).number(aux10).style(style).style(align.right);
		ws.cell(6, 14).number(aux11).style(style).style(align.right);
		ws.cell(6, 15).number(aux12).style(style).style(align.right);
		ws.cell(6, 16).number(aux13).style(style).style(align.right);
		ws.cell(6, 17).number(aux14).style(style).style(align.right);

		//logger.error(JSON.stringify(excelDataBySlot));
		try {

			if (optsParameter.crontab) {

				wb.write(path.join(process.cwd(), '/Reportes/ReporteConsolidado_' + currentDateFecha + '.xlsx'));
			}
			else {

				/***
				 * Check if the path for report exists, if not create it
				 */
				let reportStorage = path.join(process.cwd(), "ReportStorage", optsParameter.ownerId, "Reporte1");
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
};
module.exports = Reporte1;
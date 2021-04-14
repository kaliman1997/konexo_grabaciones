const logger                   = require("./Logger");
const GetUsers                 = require("./GetUsersFromGroup");
const AgentsModel              = require("../models/Agents");
const QueuesModel              = require("../models/Queues");
const PresenceDefinitionsModel = require("../models/PresenceDefinitions");
const axios                    = require('axios').default;
const mongoose                 = require('mongoose');
const excel                    = require('excel4node');
const moment_timezone          = require('moment-timezone');
const moment                   = require('moment');
const fs                       = require('fs');
const path                     = require('path');
const jsonata                  = require('jsonata');
var opts                       = {};

var Reporte20  = {

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

		let searchType = opts.searchType;
		let arrayUsers = [];

		if (opts.searchType === "group") {

			arrayUsers = await GetUsers.getUsers(opts.searchData[0].groupId);
		}
		else {
			arrayUsers = opts.searchData;
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

				presenceDefinitionsExpression = jsonata("$[systemPresence in ['Idle']].id");
				availablePresenceDefinitions  = JSON.parse(JSON.stringify(presenceDefinitionsExpression.evaluate(response[0].presenceDefinitions)));

				presenceDefinitionsExpression = jsonata("$[systemPresence in ['Available']].id");
				staffedPresenceDefinitions    = JSON.parse(JSON.stringify(presenceDefinitionsExpression.evaluate(response[0].presenceDefinitions)));

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

			//logger.info("userId => " + searchItem.userId, "userName => " + searchItem.userName);

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

					logger.error("conversationAggregateResult Axios request ERROR");
				}

				//logger.info(JSON.stringify(conversationAggregateResult.data, null, 4));

				for (const intervalData of userAggregateResult.data.results[0].data) {

					/***
					 * Configuramos OBJ para registro en XLSX
					 */
					let userSummaryTemplate = {
						reportDate   : null,
						agentName    : null,
						locationID   : null,
						staffedTime  : 0,
						holdTime     : 0,
						splitSkill   : null,
						acdCalls     : 0,
						acdTime      : 0,
						avgAcdTime   : 0,
						availableTime: 0,
						extInCalls   : 0,
						auxTime      : 0,
						extOutCalls  : 0,
						avgExtOutTime: 0,
						extOutTime   : 0
					};

					let currentInterval = intervalData.interval;

					/***
					 * reportDate field extraction
					 */
					let reportDate                 = moment(currentInterval.split("/")[0], "YYYY-MM-DDTHH:mm:ss.sssZ", true).format("MM/DD/YYYY");
					userSummaryTemplate.reportDate = reportDate;

					/***
					 * agentName, locationID field extraction
					 */
					try {

						await AgentsModel.find({"documentName": 'AgentList'}).then(function (response) {

							if (typeof response === 'undefined') {

								console.log("undefined!!!!");
							}

							let agentExpression = jsonata("$[id = '" + searchItem.userId + "']");
							let resultAgent     = agentExpression.evaluate(response[0].agents);

							userSummaryTemplate.agentName  = resultAgent.name;
							userSummaryTemplate.locationID = resultAgent.username;

						}).catch(function (error) {

							logger.error("Error on /AgentList ", error);
						});
					}
					catch (e) {

						logger.error("Error on /AgentList ", e);
					}

					//logger.info(resultPresenceDefinitions);
					//logger.info(JSON.stringify(intervalData, null, 4));

					/***
					 * auxTime field extraction
					 */
					let auxIntervalExpression   = jsonata("metrics.{'metrics': %.metrics[qualifier in " + JSON.stringify(auxPresenceDefinitions) + " ]}[0].{'total':$sum(metrics.stats.sum)}");
					let auxUserInterval         = auxIntervalExpression.evaluate(intervalData);
					userSummaryTemplate.auxTime = auxUserInterval.total || 0;

					/***
					 * availableTime field extraction
					 */
					let availableIntervalExpression   = jsonata("metrics.{'metrics': %.metrics[qualifier in " + JSON.stringify(availablePresenceDefinitions) + " ]}[0].{'total':$sum(metrics.stats.sum)}");
					let availableUserInterval         = availableIntervalExpression.evaluate(intervalData);
					userSummaryTemplate.availableTime = availableUserInterval.total || 0;

					/***
					 * staffedTime field extraction
					 */
					let staffedIntervalExpression   = jsonata("metrics.{'metrics': %.metrics[qualifier in " + JSON.stringify(staffedPresenceDefinitions) + " ]}[0].{'total':$sum(metrics.stats.sum)}");
					let staffedUserInterval         = staffedIntervalExpression.evaluate(intervalData);
					userSummaryTemplate.staffedTime = staffedUserInterval.total || 0;

					// do userAggregate logic for this interval

					//logger.info(currentInterval);
					let converstaionIntervalExpression = jsonata("" +
						"results.group[queueId].{" +
						"   'queueId': queueId, " +
						"   'data': %.data[interval = '" + currentInterval + "']" +
						"}"
					);

					var resultConverstaionInterval = converstaionIntervalExpression.evaluate(conversationAggregateResult.data);

					if (typeof resultConverstaionInterval.queueId !== 'undefined') {

						//logger.info(JSON.stringify(resultConverstaionInterval, null, 4));

						/***
						 * splitSkill field extraction
						 */
						try {

							await QueuesModel.find({"documentName": 'QueueList'}).then(function (response) {

								if (typeof response === 'undefined') {

									console.log("undefined!!!!");
								}

								let queueExpression = jsonata("$[id = '" + resultConverstaionInterval.queueId + "']");
								let resultQueue     = queueExpression.evaluate(response[0].queues);

								//logger.info(JSON.stringify(resultQueue, null, 4));

								userSummaryTemplate.splitSkill = resultQueue.name;

							}).catch(function (error) {

								logger.error("Error on /AgentList ", error);
							});
						}
						catch (e) {

							logger.error("Error on /AgentList ", e);
						}

						/***
						 * acdTime, acdCalls field extraction
						 */
						let acdTimeIntervalExpression = jsonata("" +
							"data.metrics[metric = 'tTalkComplete'].{" +
							"   'count' : stats.count," +
							"	'time': stats.sum" +
							"}"
						);
						let acdTimeInterval           = acdTimeIntervalExpression.evaluate(resultConverstaionInterval);
						userSummaryTemplate.acdCalls  = (typeof acdTimeInterval === 'undefined') ? 0 : (acdTimeInterval.count || 0);
						userSummaryTemplate.acdTime   = (typeof acdTimeInterval === 'undefined') ? 0 : (acdTimeInterval.time || 0);

						if (userSummaryTemplate.acdCalls > 0) {

							userSummaryTemplate.avgAcdTime = Math.round(userSummaryTemplate.acdTime / userSummaryTemplate.acdCalls);
						}

						/***
						 * staffedTime field extraction
						 */
						let holdTimeIntervalExpression = jsonata("" +
							"data.metrics[metric = 'tHeldComplete'].{" +
							"	'time': stats.sum" +
							"}"
						);
						let holdTimeInterval           = holdTimeIntervalExpression.evaluate(resultConverstaionInterval) || {time: 0};
						userSummaryTemplate.holdTime   = (typeof acdTimeInterval === 'undefined') ? 0 : (holdTimeInterval.time || 0);

						excelData.push(userSummaryTemplate);

					}
				}

			}
			catch (error) {

				logger.error(error);
				return;
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
			numberFormat: '#,###,###; (#,###,###); -'
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

		let groupValue = (optsParameter.searchType === "group") ? optsParameter.searchData.groupName : "Búsqueda x agente";
		ws.cell(1, 3).string("Fecha Inicio: " + moment(optsParameter.startDate).format("MM/DD/YYYY")).style(style).style({font: {bold: true}});
		ws.cell(2, 3).string("Fecha Termino: " + moment(optsParameter.finalDate).format("MM/DD/YYYY")).style(style).style({font: {bold: true}});
		ws.cell(3, 3).string("Grupo: " + groupValue).style(style).style({font: {bold: true}});

		ws.column(1).setWidth(23);
		ws.column(2).setWidth(40);
		ws.column(3).setWidth(50);
		ws.column(4).setWidth(23);
		ws.column(5).setWidth(23);
		ws.column(6).setWidth(40);
		ws.column(7).setWidth(50);
		ws.column(8).setWidth(23);
		ws.column(9).setWidth(23);
		ws.column(10).setWidth(23);
		ws.column(11).setWidth(23);
		ws.column(12).setWidth(23);
		ws.column(13).setWidth(23);
		ws.column(14).setWidth(23);
		ws.column(15).setWidth(23);
		ws.column(16).setWidth(23);
		ws.column(17).setWidth(30);

		ws.cell(5, 1).string("Fecha Reporte").style(style).style(headerStyle);
		ws.cell(5, 2).string("Agent Name").style(style).style(headerStyle);
		ws.cell(5, 3).string("Location ID").style(style).style(headerStyle);
		ws.cell(5, 4).string("Staffed Time").style(style).style(headerStyle);
		ws.cell(5, 5).string("Hold Time").style(style).style(headerStyle);
		ws.cell(5, 6).string("Split/Skill").style(style).style(headerStyle);
		ws.cell(5, 7).string("ACD Calls").style(style).style(headerStyle);
		ws.cell(5, 8).string("ACD Time").style(style).style(headerStyle);
		ws.cell(5, 9).string("Avg ACD Time").style(style).style(headerStyle);
		ws.cell(5, 10).string("Avail Time").style(style).style(headerStyle);
		ws.cell(5, 11).string("Ext In Calls").style(style).style(headerStyle);
		ws.cell(5, 12).string("AUX Time").style(style).style(headerStyle);
		ws.cell(5, 13).string("Ext Out Calls").style(style).style(headerStyle);
		ws.cell(5, 14).string("Avg Ext Out Time").style(style).style(headerStyle);
		ws.cell(5, 15).string("AG_AUX_ALLOWED").style(style).style(headerStyle);
		ws.cell(5, 16).string("AG_AVG_WK").style(style).style(headerStyle);
		ws.cell(5, 17).string("Tiempo de salida de la extn").style(style).style(headerStyle);

		var initialRow = 6;
		excelData.forEach((rowData, pointer) => {

			//n   logger.info(pointer, "=>", JSON.stringify(rowData));

			ws.cell(initialRow, 1).string(rowData.reportDate).style(style).style(align.left);
			ws.cell(initialRow, 2).string(rowData.agentName).style(style).style(align.left);
			ws.cell(initialRow, 3).string(rowData.locationID).style(style).style(align.left);
			ws.cell(initialRow, 4).number(Math.round(rowData.staffedTime / 1000)).style(style).style(align.center);
			ws.cell(initialRow, 5).number(Math.round(rowData.holdTime / 1000)).style(style).style(align.center);
			ws.cell(initialRow, 6).string(rowData.splitSkill).style(style).style(align.right);
			ws.cell(initialRow, 7).number(rowData.acdCalls).style(style).style(align.center);
			ws.cell(initialRow, 8).number(Math.round(rowData.acdTime / 1000)).style(style).style(align.center);
			ws.cell(initialRow, 9).number(Math.round(rowData.avgAcdTime / 1000)).style(style).style(align.center);
			ws.cell(initialRow, 10).number(Math.round(rowData.availableTime / 1000)).style(style).style(align.center);
			ws.cell(initialRow, 11).number(rowData.extInCalls).style(style).style(align.center);
			ws.cell(initialRow, 12).number(Math.round(rowData.auxTime / 1000)).style(style).style(align.center);
			ws.cell(initialRow, 13).number(rowData.extOutCalls).style(style).style(align.center);
			ws.cell(initialRow, 14).number(Math.round(rowData.avgExtOutTime / 1000)).style(style).style(align.center);
			ws.cell(initialRow, 15).string("").style(style).style(align.center);
			ws.cell(initialRow, 16).string("").style(style).style(align.center);
			ws.cell(initialRow, 17).number(rowData.extOutTime).style(style).style(align.center);

			initialRow++;
		});

		try {

			if (optsParameter.crontab) {

				wb.write(path.join(process.cwd(), '/Reportes/ReporteConsolidado_' + currentDateFecha + '.xlsx'));
			}
			else {

				/***
				 * Check if the path for report exists, if not create it
				 */
				let reportStorage = path.join(process.cwd(), "ReportStorage", optsParameter.ownerId, "Reporte20",);
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
module.exports = Reporte20;

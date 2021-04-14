const axios       = require('axios').default;
const mongoose    = require('mongoose');
const moment      = require('moment');
const logger      = require("./Logger");
const QueuesModel = require("../models/Queues");
const Token       = require('./Token');
const Schema      = mongoose.Schema;

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

var Queues = {

	getQueues: async function () {

		var token = await Token.createToken();

		var nextPage    = '';
		var arrayQueues = [];

		var options = {
			method : 'GET',
			url    : process.env.URLPETICION + 'routing/queues/divisionviews/all?pageSize=100&pageNumber=1',
			headers: {
				'Authorization': token.token_type + ' ' + token.access_token,
				'Content-Type' : 'application/json'
			}
		};

		try {

			var result = await axios(options).catch(function (error) {

				logger.error(error.response.status + " - " + error.response.statusText);
				return;
			});

			for (let i = 0; i < result.data.entities.length; i++) {
				arrayQueues.push(result.data.entities[i]);
			}

			logger.info("First page: " + arrayQueues.length + " Queues");

			if (result.data.pageCount > 1) {

				for (let i = 1; i < result.data.pageCount;) {

					i++;
					options.url = process.env.URLPETICION + 'routing/queues/divisionviews/all?pageSize=100&pageNumber=' + i;

					result = await axios(options).catch(function (error) {

						logger.error(error.response.status + " - " + error.response.statusText);
					});

					for (let j = 0; j < result.data.entities.length; j++) {

						arrayQueues.push(result.data.entities[j]);
					}

					logger.info("Page " + i + ": " + result.data.entities.length + " Queues [ Total: " + arrayQueues.length + "]");

					await sleep(1000).then(() => {

						logger.info('Sleep Thread 1seg, PENDING FILL');
					});
				}
			}

		}
		catch (error) {

			logger.error(error);
			return;
		}

		await QueuesModel.deleteMany({'documentName': 'QueueList'});

		const mongoDocument        = new QueuesModel();
		mongoDocument.documentName = 'QueueList';

		for (let i = 0; i < arrayQueues.length; i++) {

			var groupObject = arrayQueues[i];

			mongoDocument.queues[i] = {

				id  : groupObject.id,
				name: groupObject.name
			};
		}

		await mongoDocument.save().catch(function (error) {

			logger.error(error);
		});

	}
};

module.exports = Queues;

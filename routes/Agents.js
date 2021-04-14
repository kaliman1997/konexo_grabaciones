const axios       = require('axios').default;
const mongoose    = require('mongoose');
const moment      = require('moment');
const logger      = require("./Logger");
const AgentsModel = require("../models/Agents");
const Token       = require('./Token');
const Schema      = mongoose.Schema;

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

var Agents = {

	getAgents: async function () {

		var token = await Token.createToken();

		var nextPage    = '';
		var arrayAgents = [];

		var options = {
			method : 'GET',
			url    : process.env.URLPETICION + 'users?pageSize=100&pageNumber=1',
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
				arrayAgents.push(result.data.entities[i]);
			}

			logger.info("First page: " + arrayAgents.length + " users");

			if (result.data.pageCount > 1) {

				for (let i = 1; i < result.data.pageCount;) {

					i++;
					options.url = process.env.URLPETICION + 'users?pageSize=100&pageNumber=' + i;

					result = await axios(options).catch(function (error) {

						logger.error(error.response.status + " - " + error.response.statusText);
					});

					for (let j = 0; j < result.data.entities.length; j++) {

						arrayAgents.push(result.data.entities[j]);
					}

					logger.info("Page " + i + ": " + result.data.entities.length + " users [ Total: " + arrayAgents.length + "]");

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

		await AgentsModel.deleteMany({'documentName': 'AgentList'});

		const mongoDocument        = new AgentsModel();
		mongoDocument.documentName = 'AgentList';

		for (let i = 0; i < arrayAgents.length; i++) {

			var agentObject = arrayAgents[i];

			mongoDocument.agents[i] = {

				id  : agentObject.id,
				name: agentObject.name,
				username: agentObject.username,
			};
		}

		await mongoDocument.save().catch(function (error) {

			logger.error(error);
		});

	}
};

module.exports = Agents;

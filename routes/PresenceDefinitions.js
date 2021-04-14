const axios                    = require('axios').default;
const mongoose                 = require('mongoose');
const moment                   = require('moment');
const logger                   = require("./Logger");
const PresenceDefinitionsModel = require("../models/PresenceDefinitions");
const Token                    = require('./Token');
const Schema                   = mongoose.Schema;

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

var PresenceDefinitions = {

	getPresenceDefinitions: async function () {

		var token = await Token.createToken();

		var nextPage                 = '';
		var arrayPresenceDefinitions = [];

		var options = {
			method : 'GET',
			url    : process.env.URLPETICION + 'presencedefinitions?pageSize=100&pageNumber=1',
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
				arrayPresenceDefinitions.push(result.data.entities[i]);
			}

			logger.info("First page: " + arrayPresenceDefinitions.length + " presencedefinitions");

			if (result.data.pageCount > 1) {

				for (let i = 1; i < result.data.pageCount;) {

					i++;
					options.url = process.env.URLPETICION + 'presencedefinitions?pageSize=100&pageNumber=' + i;

					result = await axios(options).catch(function (error) {

						logger.error(error.response.status + " - " + error.response.statusText);
					});

					for (let j = 0; j < result.data.entities.length; j++) {

						arrayPresenceDefinitions.push(result.data.entities[j]);
					}

					logger.info("Page " + i + ": " + result.data.entities.length + " presenceDefinitions [ Total: " + arrayPresenceDefinitions.length + "]");

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

		await PresenceDefinitionsModel.deleteMany({'documentName': 'PresenceDefinitions'});

		const mongoDocument        = new PresenceDefinitionsModel();
		mongoDocument.documentName = 'PresenceDefinitions';

		for (let i = 0; i < arrayPresenceDefinitions.length; i++) {

			var presenceDefinitionObject = arrayPresenceDefinitions[i];

			mongoDocument.presenceDefinitions[i] = {

				id            : presenceDefinitionObject.id,
				description   : presenceDefinitionObject.languageLabels.en_US,
				systemPresence: presenceDefinitionObject.systemPresence,
				primary       : presenceDefinitionObject.primary

			};
		}

		await mongoDocument.save().catch(function (error) {

			logger.error(error);
		});

	}
};

module.exports = PresenceDefinitions;

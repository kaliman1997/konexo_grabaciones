const axios  = require('axios').default;
const logger = require("./Logger.js");
const Token  = require("./Token.js");

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

var Group = {

	getUsers: async function (groupId) {

		var token = await Token.createToken();

		var nextPage   = '';
		var arrayUsers = [];

		var options = {
			method : 'GET',
			url    : process.env.URLPETICION + 'groups/' + groupId + '/members?pageSize=100&pageNumber=1',
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
				let userObject = {
					userId: result.data.entities[i].id
				};
				arrayUsers.push(userObject);
			}

			logger.info("First page: " + arrayUsers.length + " Users");

			if (result.data.pageCount > 1) {

				for (let i = 1; i < result.data.pageCount;) {

					i++;
					options.url = process.env.URLPETICION + 'groups/' + groupId + '/members?pageSize=100&pageNumber=' + i;

					result = await axios(options).catch(function (error) {

						logger.error(error.response.status + " - " + error.response.statusText);
					});

					for (let j = 0; j < result.data.entities.length; j++) {

						let userObject = {
							userId: result.data.entities[j].id
						};
						arrayUsers.push(userObject);
					}

					logger.info("Page " + i + ": " + result.data.entities.length + " Users [ Total: " + arrayUsers.length + "]");

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

		return arrayUsers;
	}
};

module.exports = Group;

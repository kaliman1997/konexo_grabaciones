const axios  = require('axios').default;
const logger = require("./Logger.js");

var Token = {

	createToken: async function () {

		var encodedData = Buffer.from(process.env.CLIENTID + ':' + process.env.CLIENTSECRET).toString('base64');

		var options     = {
			method : 'POST',
			url    : process.env.URLTOKEN,
			headers: {
				'Content-Type' : 'application/x-www-form-urlencoded',
				'Authorization': 'Basic ' + encodedData
			},
			data   : "grant_type=client_credentials"
		};

		let response = await axios(options);
		return response.data;
	}
};

module.exports = Token;

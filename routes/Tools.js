const logger   = require("./Logger");
const path     = require('path');
const moment   = require('moment');
var loggerName = "";

Tools          = {

	sleep       : function (ms) {

		return new Promise(resolve => setTimeout(resolve, ms));
	},
	getSlotsIntervals: function () {

		var start = moment('2021-01-01 00:00:00.000');
		var end   = moment('2021-01-02 00:00:00.000');

		var result = [];

		while (start < end) {

			result.push(start.format('HH:mm:ss.000') + "/" + start.add(15, 'minutes').format('HH:mm:ss.000'));

		}
		//logger.info(result);

		return result;
	},
	getMinuteIntervals: function (startString, endString) {

		logger.info(startString,endString);
		var start = moment.tz(startString, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]', "America/Mexico_City");
		var end   = moment.tz(endString, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]', "America/Mexico_City");

		start.minutes(Math.ceil(start.minutes() / 15) * 15);

		var result = [];

		while (start < end) {

			result.push(start.format('YYYY-MM-DD[T]HH:mm:ss.000[Z]') + "/" + start.add(15, 'minutes').format('YYYY-MM-DD[T]HH:mm:ss.000[Z]'));

		}
		//logger.info(result);

		return result;
	},
	getDayIntervals: function (startString, endString) {

		var start = moment.tz(startString, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]', "America/Mexico_City");
		var end   = moment.tz(endString, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]', "America/Mexico_City");

		start.minutes(Math.ceil(start.minutes() / 15) * 15);

		var result = [];

		while (start < end) {

			result.push(start.format('YYYY-MM-DD'));
			start.add(1, 'day')

		}
		//logger.info(result);

		return result;
	},
	raxConfig   : function () {

		return {
			retry             : 3,
			noResponseRetries : 2,
			retryDelay        : 1000,
			httpMethodsToRetry: ['GET', 'HEAD', 'OPTIONS', 'DELETE', 'PUT', 'POST'],
			statusCodesToRetry: [[100, 199], [400, 499], [500, 599]],
			backoffType       : 'exponential',
			onRetryAttempt    : err => {
				const cfg = rax.getConfig(err);
				logger.error(process.env.URLPETICION + 'analytics/conversations/details/querys FAIL with error: ' + err.response.status + ' Retry attempt #' + cfg.currentRetryAttempt);
			}
		};
	}
};
module.exports = Tools;

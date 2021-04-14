const log4js = require("log4js");
const path   = require('path');
var loggerName = "";


log4js.configure({
	appenders : {
		out : {
			type: 'stdout',
			layout: {
				type   : 'pattern',
				pattern: '%[%d %p [%f{1}:%l]%] %m',
				tokens : {
					user: function (logEvent) {
						return AuthLibrary.currentUser();
					}
				}
			}
		},
		file: {
			type      : 'file',
			layout: {
				type   : 'pattern',
				pattern: '%[%d %p [%f{1}:%l]%] %m',
				tokens : {
					user: function (logEvent) {
						return AuthLibrary.currentUser();
					}
				}
			},
			mode      : 0o644,
			maxLogSize: 1024000,
			backups   : 10,
			filename  : path.join(__dirname, 'log/konexo.log')
		}
	},
	categories: {
		debug  : {enableCallStack: true, appenders: ['out', 'file'], "level": "debug"},
		default: {enableCallStack: true, appenders: ['out', 'file'], "level": "info"},
		error  : {enableCallStack: true, appenders: ['out', 'file'], "level": "error"},
		warn   : {enableCallStack: true, appenders: ['out', 'file'], "level": "warn"}
	}
});

const logger   = log4js.getLogger(loggerName);
module.exports = logger;

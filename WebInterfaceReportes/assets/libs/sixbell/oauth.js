var profileData;

function authenticate(client, pcEnvironment) {
	// Allow targeting a different environment when host app is running locally
	const platformEnvironment = pcEnvironment === 'localhost' ? 'mypurecloud.com' : pcEnvironment;
	/*
	 * Note: To use this app in your own org, you will need to create your own OAuth2 Client(s)
	 * in your Genesys Cloud org.  After creating the Implicit grant client, map the client id(s) to
	 * the specified region key(s) in the object below, deploy the page, and configure an app to point to that URL.
	 */
	const pcOAuthClientIds = {'mypurecloud.com': '8774d45f-eb22-4ace-b02f-21cbc38c7865'};
	const clientId         = pcOAuthClientIds[platformEnvironment];
	if (!clientId) {
		const defaultErr = platformEnvironment + ': Unknown/Unsupported Genesys Cloud Environment';
		const localErr   = `
            The host app is running locally and the target platform client environment was mapped to '${platformEnvironment}'.
            Ensure that you have an oauth client specified for this environment.
        `;
		return Promise.reject(new Error(pcEnvironment === 'localhost' ? localErr : defaultErr));
	}

	client.setEnvironment(platformEnvironment);
	client.setPersistSettings(true);

	const {origin, protocol, host, pathname} = window.location;
	const redirectUrl                        = (origin || `${protocol}//${host}`) + pathname;

	return client.loginImplicitGrant(clientId, redirectUrl, {state: `pcEnvironment=${pcEnvironment}`}).then(data => {

		window.history.replaceState(null, '', `${pathname}?${data.state}`);

	});
}

$(document).ready(function ($) {
	/*
	 * The Client Apps SDK can interpolate the current PC Environment into your app's URL
	 * EX: https://mypurecloud.github.io/client-app-sdk/profile.html?pcEnvironment={{pcEnvironment}}
	 *
	 * Reading the PC Environment from the query string or state param returned from OAuth2 response
	 */
	let pcEnvironment = getEmbeddingPCEnv();
	if (!pcEnvironment) {
		console.log('Cannot identify App Embedding context.  Did you forget to add pcEnvironment={{pcEnvironment}} to your app\'s query string?');
		return;
	}

	let platformClient = window.require('platformClient');
	let client         = platformClient.ApiClient.instance;
	let clientApp      = null;
	try {
		clientApp = new window.purecloud.apps.ClientApp({
			pcEnvironment: pcEnvironment
		});
	}
	catch (e) {
		console.log(pcEnvironment + ': Unknown/Unsupported Genesys Cloud Embed Context');
		return;
	}

	// Authenticate with Genesys Cloud
	let authenticated = false;
	authenticate(client, pcEnvironment).then(() => {

		authenticated = true;
		return new platformClient.UsersApi().getUsersMe();

	}).then(profileDataLocal => {

		$('#userId').val(profileDataLocal.id);
		console.log($('#userId').val());

	}).catch(err => {

		console.log(!authenticated ? 'Failed to Authenticate with Genesys Cloud - ' + err.message : 'Failed to fetch/display your profile');

	});

	// ----- Helper Functions

	/**
	 * Sets the base mode of the app to error and show the provided message
	 */
	function setErrorState(errorMsg) {
		let failureEl         = document.querySelector('.failure');
		failureEl.textContent = errorMsg;
		setHidden(failureEl, false);
	}

	/**
	 * Determine the embedding Genesys Cloud environment seeded on the query string or
	 * being returned through the OAuth2 Implicit grant state hash param.
	 *
	 * @returns A string indicating the embedding PC env (e.g. mypurecloud.com, mypurecloud.jp); otherwise, null.
	 */
	function getEmbeddingPCEnv() {
		let result = null;

		if (window.location.hash && window.location.hash.indexOf('access_token') >= 0) {
			let oauthParams = extractParams(window.location.hash.substring(1));
			if (oauthParams && oauthParams.access_token && oauthParams.state) {
				// OAuth2 spec dictates this encoding
				// See: https://tools.ietf.org/html/rfc6749#appendix-B
				let stateSearch = unescape(oauthParams.state);
				result          = extractParams(stateSearch).pcEnvironment;
			}
		}

		if (!result && window.location.search) {
			result = extractParams(window.location.search.substring(1)).pcEnvironment || null;
		}

		return result;
	}

	function extractParams(paramStr) {
		let result = {};

		if (paramStr) {
			let params = paramStr.split('&');
			params.forEach(function (currParam) {
				if (currParam) {
					let paramTokens = currParam.split('=');
					let paramName   = paramTokens[0];
					let paramValue  = paramTokens[1];
					if (paramName) {
						paramName  = decodeURIComponent(paramName);
						paramValue = paramValue ? decodeURIComponent(paramValue) : null;

						if (!result.hasOwnProperty(paramName)) {
							result[paramName] = paramValue;
						}
						else if (Array.isArray(result[paramName])) {
							result[paramName].push(paramValue);
						}
						else {
							result[paramName] = [result[paramName], paramValue];
						}
					}
				}
			});
		}

		return result;
	}
});

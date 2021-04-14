var roomUUID        = "";
var today           = moment();
var todayOneWeekAgo = moment().subtract(7, 'd');

if (sessionStorage.getItem('roomUUID') !== null) {

	roomUUID = sessionStorage.getItem('roomUUID');
}
else {

	roomUUID = getUUID();
	sessionStorage.setItem('roomUUID', roomUUID);
}

var socket = io({
	query: {
		"roomUUID": roomUUID
	}
});

$(document).ready(function ($) {

	$("#sidebar").mCustomScrollbar({
		theme: "minimal"
	});

	$('#sidebarCollapse').on('click', function () {
		$('#sidebar, #content').toggleClass('active');
		$('.collapse.in').toggleClass('in');
		$('a[aria-expanded=true]').attr('aria-expanded', 'false');
	});

	$('#consolidado').click(function () {

		//$('#main_container').css("display","none");
		$('#main_container, #epa_div, #webchat_div, #whatsapp_div').hide();
		$('#consolidado_div').show();
	});

	$('#epa').click(function () {
		//$('#main_container').css("display","none");
		$('#main_container, #consolidado_div, #webchat_div, #whatsapp_div').hide();
		$('#epa_div').show();
	});

	$('#webchat').click(function () {
		//$('#main_container').css("display","none");
		$('#main_container, #consolidado_div, #epa_div, #whatsapp_div').hide();
		$('#webchat_div').show();
	});

	$('#whatsapp').click(function () {
		//$('#main_container').css("display","none");
		$('#main_container, #consolidado_div, #epa_div, #webchat_div').hide();
		$('#whatsapp_div').show();
	});

});

function getUUID() {

	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	}

	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

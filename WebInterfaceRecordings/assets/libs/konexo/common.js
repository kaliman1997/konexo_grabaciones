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

	$('#download').click(function () {
		//$('#main_container').css("display","none");
		$('#main_container_content, #main_container_nav, #delete_content_div, #delete_nav').hide();
		$('#download_content_div, #download_nav').show();
	});

	$('#delete').click(function () {
		//$('#main_container').css("display","none");
		$('#main_container_content, #main_container_nav, #download_nav, #download_content_div').hide();
		$('#delete_content_div, #delete_nav').show();
	});

});

function getUUID() {

	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	}

	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

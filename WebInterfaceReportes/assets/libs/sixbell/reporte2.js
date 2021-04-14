var filterTypeGlobal    = "byQueue";
var filterTypeGlobalURL = "/QueueList";
var queueUniverse       = [];

var dataTableOptions = {

	sPaginationType: "full_numbers",
	bprocessing    : false,
	bServerSide    : false,
	bLengthChange  : true,
	bInfo          : true,
	paging         : true,
	searching      : true,
	bDestroy       : true,
	dom            : 'lfrtip',
	order          : [[0, "asc"]],
	lengthMenu     : [
		[
			10,
			20,
			30,
			-1
		],
		[
			"Mostrar 10 registros  ",
			"Mostrar 25 registros  ",
			"Mostrar 50 registros  ",
			"Todos los registros  "
		]
	],
	language       : {
		url: "/WebReports/assets/libs/datatables/1.10.15/js/spanish.json"
	},
	ajax           : {
		url    : filterTypeGlobalURL,
		type   : "GET",
		data   : {
			reportFilter: filterTypeGlobal
		},
		dataSrc: ""
	},
	columns        : [
		{
			data         : "id",
			render       : function (data, type, row) {
				return "&nbsp;&nbsp;&nbsp;&nbsp;<input id='" + data + "' onChange='addItem()' type='checkbox' value='" + data + "' style='margin-left: 15px !important;'>";
			},
			sTitle       : "",
			sWidth       : "20px",
			bSortable    : true,
			orderDataType: "dom-checkbox",
			bSort        : false
		},
		{
			data          : "name",
			sTitle        : "Nombre",
			defaultContent: "---",
			bSortable     : true
		}
	]
};

socket.on('reporte_2', function (msg) {

	setTimeout(function () {

		$.ajax({
			url    : msg.filename,
			type   : 'HEAD',
			error  : function () {
				console.log("Reporte no disponible");
			},
			success: function () {
				window.location.href = msg.filename;
			}
		});

	}, 3000);

});

function addItem() {

	var queueUniverse = [];

	var source_list = $('#source_list').DataTable();

	source_list.rows().every(function (rowIdx, tableLoop, rowLoop) {

		var row      = source_list.row(rowIdx);
		var row_data = row.data();

		//console.log(row_data);

		if ($('#' + row_data.id).is(':checked')) {

			let queueObject = {
				queueId: $('#' + row_data.id).val()
			};
			queueUniverse.push(queueObject);
		}
	});
}

$(document).ready(function ($) {

	$('#showsourceList').click(function () {

		$("#report_list").hide().DataTable().destroy(true);
		$('#reportContainer').append("<table id='report_list' class='table table-condensed table-hover table-striped' style='width: 100%; display: none'></table>");

		$('#showReportHistory').show();
		$('#showsourceList').hide();

		var queueUniverse = [];

		dataTableOptions.ajax.url = "/QueueList";

		filterTypeGlobal = "byQueue";
		var source_list  = $("#source_list").on('init.dt', function () {

			console.log('Table initialisation complete: ' + new Date().getTime());
			//$('#source_list').icheck({checkboxClass: 'icheckbox_flat-purple', radioClass: 'iradio_flat-purple'});

		}).on('error.dt', function (e, settings, techNote, message) {

			console.log('An error has been reported by DataTables: ', message);

		}).DataTable(dataTableOptions).on('click', 'tr', function (evt) {

			var data = source_list.row($(this)).data();
			if ($(evt.target).is("i") || $(evt.target).is("span") || $(evt.target).is("input") || $(evt.target).is("button") || evt.currentTarget.innerHTML.startsWith("<th")) {
				return;
			}
		});

	});

	$('#showReportHistory').click(function () {

		// eliminamos y recreamos tabla de usuarios
		$("#source_list").hide().DataTable().destroy(true);
		$('#reportContainer').append("<table id='source_list' class='table table-condensed table-hover table-striped' style='width: 100%;'></table>");

		$('#showReportHistory').hide();
		$('#showsourceList').show();

		$("#report_list").show();

		var source_list = $("#report_list").on('error.dt', function (e, settings, techNote, message) {

			console.log('An error has been reported by DataTables: ', message);
		}).DataTable({

			sPaginationType: "full_numbers",
			bprocessing    : false,
			bServerSide    : false,
			bLengthChange  : true,
			bInfo          : true,
			paging         : true,
			searching      : true,
			bDestroy       : true,
			dom            : 'lfrtip',
			order          : [[0, "asc"]],
			lengthMenu     : [
				[
					10,
					20,
					30,
					-1
				],
				[
					"Mostrar 10 registros  ",
					"Mostrar 25 registros  ",
					"Mostrar 50 registros  ",
					"Todos los registros  "
				]
			],
			language       : {
				url: "/WebReports/assets/libs/datatables/1.10.15/js/spanish.json"
			},
			ajax           : {
				url    : "/ReportList",
				type   : "POST",
				data   : {
					reportId: 2,
					userId  : $('#userId').val()
				},
				dataSrc: ""
			},
			columns        : [
				{
					data          : "filename",
					sTitle        : "Nombre de archivo",
					defaultContent: "---",
					bSortable     : true
				},
				{
					data          : "creationDate",
					sTitle        : "Creaci&oacute;n de reporte",
					defaultContent: "---",
					bSortable     : false
				},
				{
					data          : "reportDate",
					sTitle        : "Rango Reporte",
					defaultContent: "---",
					render        : function (data, type, row) {

						let fileStringArray = row.filename.replace(".xlsx", "").split("_");

						let startDateMoment = moment(fileStringArray[2] + "" + fileStringArray[3], "YYYYMMDDHHmm", true);
						let finalDateMoment = moment(fileStringArray[4] + "" + fileStringArray[5], "YYYYMMDDHHmm", true);

						return startDateMoment.format("MM/DD/YYYY HH:mm") + " al " + finalDateMoment.format("MM/DD/YYYY HH:mm");
					},
					bSortable     : false
				},
				{
					data          : "filename",
					render        : function (data, type, row) {

						return "<button type='button' class='btn btn-red btn-icon btn-icon-standalone btn-xs' onClick='window.location.href = \"/ReportStorage/" + $('#userId').val() + "/Report2/" + data + "\"'>" +
							"<i class='far fa-download'></i>" +
							"<span>Descargar</span>" +
							"</button>";
					},
					bSortable     : false,
					sTitle        : "",
					width         : "180px",
					defaultContent: "---"
				}
			]
		}).on('click', 'tr', function (evt) {

			var data = consolidado_list.row($(this)).data();
			if ($(evt.target).is("i") || $(evt.target).is("span") || $(evt.target).is("button") || evt.currentTarget.innerHTML.startsWith("<th")) {
				return;
			}

			window.location.href = "/Reportes/" + data.filename;

		});
	});

	var source_list = $("#source_list").on('init.dt', function () {

		console.log('Table initialisation complete: ' + new Date().getTime());
		//$('#source_list').icheck({checkboxClass: 'icheckbox_flat-purple', radioClass: 'iradio_flat-purple'});

	}).on('error.dt', function (e, settings, techNote, message) {

		console.log('An error has been reported by DataTables: ', message);

	}).DataTable(dataTableOptions).on('click', 'tr', function (evt) {

		var data = source_list.row($(this)).data();
		if ($(evt.target).is("i") || $(evt.target).is("span") || $(evt.target).is("input") || $(evt.target).is("button") || evt.currentTarget.innerHTML.startsWith("<th")) {
			return;
		}
	});

	$('#report_submit').click(function () {

		var queueUniverse = [];

		var source_list = $('#source_list').DataTable();

		source_list.rows().every(function (rowIdx, tableLoop, rowLoop) {

			var row      = source_list.row(rowIdx);
			var row_data = row.data();

			if ($('#' + row_data.id).is(':checked')) {

				let queueObject = {
					queueId: $('#' + row_data.id).val()
				};
				queueUniverse.push(queueObject);
			}
		});

		$('#overlay_page').css("display", 'block');

		var startDate  = $('#start_date').val();
		var finalDate  = $('#final_date').val();
		var searchType = 'queue';
		var searchData = queueUniverse;

		if (searchData.length === 0) {

			$('#overlay_page').css("display", 'none');
			$('#empty_error_modal').modal('show', modal_opts).detach().appendTo("body");
			return;
		}

		var data = {
			reportId  : 2,
			startDate : startDate,
			finalDate : finalDate,
			ownerId   : $('#userId').val(),
			crontab   : false,
			searchType: searchType,
			searchData: searchData,
			roomUUID  : roomUUID
		};
		console.log(JSON.stringify(data, null, 4));

		var settings1 = {
			"url"    : "/Reporte",
			"method" : "POST",
			"timeout": 60000,
			"headers": {
				"Content-Type": "application/json"
			},
			"data"   : JSON.stringify(data)
		};

		$.ajax(settings1).done(function (response) {
			console.log(response);
			$('#overlay_page').css("display", 'none');
			$('#start_execution_modal').modal('show', modal_opts).detach().appendTo("body");
		}).fail(function (response) {
			console.log(response);
			$('#overlay_page').css("display", 'none');
			console.log(response);
			console.log(status);
		});

	});

	$('#start_date, #final_date').val(today.format('YYYY-MM-DD, HH:mm'));

	$('#start_range_label').attr("placeholder",
		todayOneWeekAgo.format("MMM DD, YYYY, HH:mm") + " --- " + today.format("MMM DD, YYYY, HH:mm")
	);

	$('#start_date').val(todayOneWeekAgo.format('YYYY-MM-DD HH:mm'));
	$('#final_date').val(today.format('YYYY-MM-DD HH:mm'));

	$('#start_range_trigger').daterangepicker({
		parentEl           : "title_div",
		showDropdowns      : true,
		minYear            : "2021",
		minDate            : "2021-01-01",
		timePicker         : false,
		timePickerIncrement: 5,
		timePicker24Hour   : true,
		ranges             : {
			"Hoy"                          : [
				moment(),
				moment()
			],
			"Ayer"                         : [
				moment().subtract(1, 'd'),
				moment().subtract(1, 'd')
			],
			"&Uacute;ltimos 7 d&iacute;as" : [
				moment().subtract(7, 'd'),
				moment()
			],
			"&Uacute;ltimos 30 d&iacute;as": [
				moment().subtract(30, 'd'),
				moment()
			],
			"Este mes"                     : [
				moment().startOf('month'),
				moment()
			],
			"Mes pasado"                   : [
				moment().subtract(1, 'month').startOf('month'),
				moment().subtract(1, 'month').endOf('month')
			]
		},
		locale             : {
			format          : "YYYY-MM-DD HH:mm",
			separator       : " al ",
			applyLabel      : "Aplicar Filtro",
			cancelLabel     : "Cancelar",
			fromLabel       : " De ",
			toLabel         : " Al ",
			customRangeLabel: "Personalizado",
			weekLabel       : "S",
			daysOfWeek      : ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sa"],
			monthNames      : ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Augosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
			firstDay        : 1
		},
		alwaysShowCalendars: true,
		startDate          : todayOneWeekAgo,
		endDate            : today,
		opens              : "center"
	}, function (start, end, label) {

		$('#start_range_label').attr("placeholder",

			start.format("MMM DD, YYYY, HH:mm") + " al " + end.format("MMM DD, YYYY, HH:mm")
		);

		$('#start_date').val(start.format('YYYY-MM-DD HH:mm'));
		$('#final_date').val(end.format('YYYY-MM-DD HH:mm'));
	});
});

socket.on('consolidado_response', function (msg) {

	console.log(msg);

	$('#consolidado_list').DataTable().ajax.reload();
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

$(document).ready(function ($) {
	var consolidado_list = $("#consolidado_list").on('error.dt', function (e, settings, techNote, message) {

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
		order          : [[0, "desc"]],
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
			url: "/assets/libs/datatables/1.10.15/js/spanish.json"
		},
		ajax           : {
			url    : "/ReportList",
			type   : "POST",
			data   : {
				reportFilter: 'ReporteConsolidado_'
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
				bSortable     : false
			},
			{
				data          : "filename",
				render        : function (data, type, row) {

					return "<button type='button' class='btn btn-red btn-icon btn-icon-standalone btn-xs' onClick='window.location.href = \"/Reportes/" + data + "\"'>" +
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

	$('#consolidado_submit').click(function () {

		$('#overlay_page').css("display", 'block');

		var startDate = $('#start_date_consolidado').val();
		var finalDate = $('#final_date_consolidado').val();
		var data      = {

			startDate: startDate,
			finalDate: finalDate,
			roomUUID : roomUUID
		};

		console.log(data);

		$.post("/ReporteConsolidado", data)
			.done(function (response, status, error) {

				$('#overlay_page').css("display", 'none');
				$('#start_execution_modal').modal('show', modal_opts).detach().appendTo("body");
			})
			.fail(function (response, status, error) {
				$('#overlay_page').css("display", 'none');
				console.log(response);
				console.log(status);
			});
	});

	$('#start_date_consolidado, #final_date_consolidado').val(today.format('YYYY-MM-DD, HH:mm'));

	$('#start_range_label_consolidado').attr("placeholder",
		todayOneWeekAgo.format("MMM DD, YYYY, HH:mm") + " --- " + today.format("MMM DD, YYYY, HH:mm")
	);

	$('#start_date_consolidado').val(todayOneWeekAgo.format('YYYY-MM-DD HH:mm'));
	$('#final_date_consolidado').val(today.format('YYYY-MM-DD HH:mm'));

	$('#start_range_trigger_consolidado').daterangepicker({
		parentEl           : "title_div",
		showDropdowns      : true,
		minYear            : "2021",
		minDate            : "2021-01-01",
		timePicker         : false,
		timePickerIncrement: 5,
		timePicker24Hour   : true,
		ranges             : {
			"Hoy"            : [
				moment(),
				moment()
			],
			"Ayer"           : [
				moment().subtract(1, 'd'),
				moment().subtract(1, 'd')
			],
			"Últimos 7 días" : [
				moment().subtract(7, 'd'),
				moment()
			],
			"Últimos 30 días": [
				moment().subtract(30, 'd'),
				moment()
			],
			"Este mes"       : [
				moment().startOf('month'),
				moment()
			],
			"Mes pasado"     : [
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
		startDate: todayOneWeekAgo,
		endDate  : today,
		opens    : "center"
	}, function (start, end, label) {

		$('#start_range_label_consolidado').attr("placeholder",

			start.format("MMM DD, YYYY, HH:mm") + " al " + end.format("MMM DD, YYYY, HH:mm")
		);

		$('#start_date_consolidado').val(start.format('YYYY-MM-DD HH:mm'));
		$('#final_date_consolidado').val(end.format('YYYY-MM-DD HH:mm'));
	});
});

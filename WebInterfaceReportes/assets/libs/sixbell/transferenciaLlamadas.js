$(document).ready(function ($) {
	var transferencia_llamadas_list = $("#transferencia_llamadas_list").on('error.dt', function (e, settings, techNote, message) {

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
		dom            : 'lrtip',
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
				reportFilter: 'transferenciaLlamadas'
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
				data          : "startDate",
				sTitle        : "Fecha Inicio",
				defaultContent: "---",
				bSortable     : false
			},
			{
				data          : "finalDate",
				sTitle        : "Fecha Final",
				defaultContent: "---",
				bSortable     : false
			},
			{
				data          : "filename",
				render        : function (data, type, row) {

					return "<button type='button' class='btn btn-red btn-icon btn-icon-standalone btn-xs' onClick='window.location.href = \"/ReportesInterseguro/" + data + "\"'>" +
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

		var data = transferencia_llamadas_list.row($(this)).data();
		if ($(evt.target).is("i") || $(evt.target).is("span") || $(evt.target).is("button") || evt.currentTarget.innerHTML.startsWith("<th")) {
			return;
		}

		window.location.href = "/ReportesInterseguro/" + data.filename;

	});
});

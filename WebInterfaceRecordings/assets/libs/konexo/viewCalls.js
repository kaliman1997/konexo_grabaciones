$(document).ready(function ($) {
    var URLactual = window.location.pathname;
    console.log(URLactual);
    var arrayUrl = URLactual.split('/');
    console.log(arrayUrl);

    var settings = {
        "url": "https://konexo.sixbell.cloud/ProcessesDeleteList/" + arrayUrl[3],
        "method": "GET",
        "timeout": 300,
    };

    $.ajax(settings).done(function (response) {
        console.log(response);
        //$("#deleteNameProcesses").empty();
        $("#deleteNameProcesses").append(`${response.name}`);
        $("#deleteTypeProcesses").append(`${response.media_type}`);
        $("#deleteCreateAtProcesses").append(`${moment(response.created_at).format('MMMM DD, hh:mm')}`);
        $("#deleteRunTimeProcesses").append(`${moment(response.created_at).format('hh:mm')}`);

        $("#deleteStartDate").append(`${moment(response.filters.start_date).format('MM/DD/YYYY')}`);
        $("#deleteEndDate").append(`${moment(response.filters.end_date).format('MM/DD/YYYY')}`);

        for (i=0; i < response.filters.logins.length; i++) {
            $('#deleteAgent').append(`${response.filters.logins[i].name}`);
            console.log(response.filters.logins[i].name);
        };
        for (i=0; i < response.filters.logins.length; i++) {
            $('#deleteGroup').append(`${response.filters.group[i].name}`);
            console.log(response.filters.group[i].name);
        };



    }).fail(function (response) {
        console.log(response);
        toastr.error("Ocurrió un error al validar backend", toastr_opts);
    });

    var viewCallsList = $("#viewDeletedRecordingsList").on('error.dt', function (e, settings, techNote, message) {
        console.log('An error has been reported by DataTables: ', message);
    }).DataTable({
        sPaginationType: "full_numbers",
        bprocessing: false,
        bServerSide: false,
        bLengthChange: true,
        bInfo: true,
        paging: true,
        searching: true,
        bDestroy: true,
        dom: 'lfrtip',
        order: [[0, "desc"]],
        columnDefs: [
            {className: 'text-center', targets: "_all"},
        ],
        lengthMenu: [
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
        language: {
            url: "/WebRecordings/assets/libs/datatables/1.10.15/js/spanish.json"
        },
        ajax: {
            url: "/DeletedCallsList/"+ arrayUrl[3],
            type: "GET",
            dataSrc: ""
        },
        columns: [
            {
                data: "call_id",
                sTitle: "Call id",
                defaultContent: "---",
                bSortable: true
            },
            {
                data: "direction",
                sTitle: "Dirección",
                defaultContent: "---",
                bSortable: true
            },
            {
                data: "division",
                sTitle: "División",
                defaultContent: "---",
                bSortable: true
            },
            {
                data: "agent",
                sTitle: "Agente",
                defaultContent: "---",
                bSortable: true
            },
            {
                data: "group",
                sTitle: "Grupo",
                defaultContent: "---",
                bSortable: true
            },
            {
                data: "ani",
                sTitle: "ANI",
                defaultContent: "---",
                bSortable: true
            },
            {
                data: "dnis",
                sTitle: "DNS",
                defaultContent: "---",
                bSortable: true
            },
            {
                data: 'start_time',
                render: function (data, type, row) {
                    return (moment(data).format('MMMM DD, hh:mm '))
                },
                sTitle: "Hora Inicio",
                defaultContent: "---",
                bSortable: false
            },
            {
                data: "end_time",
                render: function (data, type, row) {
                    var endTime = moment(row.end_time);
                    var startTime = moment(row.start_time);
                    var diff = endTime.diff(startTime, 'minutes');
                    console.log(diff);
                    return (moment.duration(diff, "minutes").humanize());
                },
                sTitle: "Duración",
                defaultContent: "---",
                bSortable: true
            },
        ]
    });
})
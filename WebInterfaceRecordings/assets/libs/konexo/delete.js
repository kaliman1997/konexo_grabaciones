$(document).ready(function ($) {

    var agentList = {};
    var groupList = {};
    var agentSelectList = [];
    var groupSelectList = [];

    var date = Date();
    var today = moment(date).format('YYYY-MM-DD');
    var dateTime = moment(date).format('YYYY-MM-DDThh:mm');
    var time = moment(date).format('hh:mm');
    $('#fechaInicioDelete, #fechaFinDelete').val(today);

    //Configure datatable
    var process_list = $("#delete_list").on('error.dt', function (e, settings, techNote, message) {
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
            {className: 'text-center', targets: "0, 1, 2"},
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
            url: "/ProcessesDeleteList",
            type: "GET",
            dataSrc: ""
        },
        columns: [
            {
                data: "name",
                sTitle: "Nombre",
                defaultContent: "---",
                bSortable: true
            },
            {
                data: 'created_at',
                render: function (data, type, row) {
                    return (moment(data).format('MMMM DD, hh:mm '))

                },
                sTitle: "Fecha Creaci&oacute;n ",
                defaultContent: "---",
                bSortable: false
            },
            {
                data: 'status',
                render: function (data, type, row) {
                    if (data == 'new') {
                        return ("Nueva");
                    }
                    if (data == 'in_progress') {
                        return ("En progreso - " + row.progress + "%");
                    }
                    if (data == 'finished') {
                        return ("Completada");
                    }
                    if (data == 'cancel') {
                        return ("Cancelada");
                    }
                },
                sTitle: "Fecha Creaci&oacute;n ",
                defaultContent: "---",
                bSortable: false
            },
            {
                data: "status",
                render: function (data, type, row) {
                    var processesRow = row._id;
                    if (data == 'new' || data == 'in_progress') {
                        return "<div class=\"col-xl-6\">" +
                            "<button type='button' class='btn btn-red btn-icon btn-icon-standalone btn-xs' onClick='CancelProcesses(\""+processesRow+"\")'>" +
                            "<i class=\"fa fa-ban\" aria-hidden=\"true\"></i>" +
                            "<span>Cancelar</span>" +
                            "</button>" +
                            "</div>" +
                            "</div>";
                    }
                    if (data == 'finished') {
                        return "<div class=\"form-group row\">" +
                            "<div class=\"col-xl-6\">" +
                            "<button type='button' class='btn btn-success btn-icon btn-icon-standalone btn-xs' onClick='ViewCalls(\""+processesRow+"\")'>" +
                            "<i class=\"fa fa-pencil\" aria-hidden=\"true\"></i>" +
                            "<span>Ver Llamadas</span>" +
                            "</button>" +
                            "</div>" +
                            "<div class=\"col-xl-6\">" +
                            "<button type='button' class='btn btn-red btn-icon btn-icon-standalone btn-xs' onClick=''>" +
                            "<i class=\"fa fa-trash\" aria-hidden=\"true\"></i>" +
                            "<span>Eliminar</span>" +
                            "</button>" +
                            "</div>" +
                            "</div>";
                    }
                    if (data == 'cancel') {

                    }
                },
                bSortable: false,
                sTitle: "Acciones",
                width: "180px",
                defaultContent: "---"
            }
        ]
    });

    //Consumir MS y configuración de MultiSelect
    $.get('/GroupList', {})
        .done(function (response, status) {
            console.log(response);
            groupList = response;
            $('#aqm_switch_Group').empty();

            for (i = 0; i < response.length; i++) {
                $("#aqm_switch_Group").append($('<option>', {
                    value: response[i].id,
                    text: response[i].name
                }));
            }

            $('#aqm_switch_Group').multiSelect({
                dblClick: true,
                selectableHeader: "<div class='custom-header'>Resultados</div>",
                selectionHeader: "<div class='custom-header'>Seleccionados</div>"
            });

            var data = {
                host_aqm: $('#host_aqm').val(),
                aqm_database: $('#aqm_database').val(),
                aqm_user: $('#aqm_user').val(),
                aqm_password: $('#aqm_password').val(),
                aqm_app_prefix: $('#aqm_app_prefix').val()
            };
        })
        .fail(function (response) {
            $("#aqm_validate").prop("disabled", false);
            $('#overlay_page').css('display', 'none');
            toastr.error("Ocurrió un error al validar backend", toastr_opts);
        });

    $.get('/AgentList', {})
        .done(function (response, status) {
            console.log(response);
            agentList = response;
            $('#aqm_switch').empty();

            for (i = 0; i < response.length; i++) {
                $("#aqm_switch").append($('<option>', {
                    value: response[i].id,
                    text: response[i].name
                }));
            }

            $('#aqm_switch').multiSelect({
                dblClick: true,
                selectableHeader: "<div class='custom-header'>Resultados</div>",
                selectionHeader: "<div class='custom-header' id='selectAgent'>Seleccionados</div>"
            });

            var data = {
                host_aqm: $('#host_aqm').val(),
                aqm_database: $('#aqm_database').val(),
                aqm_user: $('#aqm_user').val(),
                aqm_password: $('#aqm_password').val(),
                aqm_app_prefix: $('#aqm_app_prefix').val()

            };
        })
        .fail(function (response) {
            $("#aqm_validate").prop("disabled", false);
            $('#overlay_page').css('display', 'none');
            toastr.error("Ocurrió un error al validar backend", toastr_opts);
        });

    //Boton buscar agente
    $('#buttonAgentDelete').click('button', function (ev) {
        console.log('click on button agent');
        $('#agentModalSearch').modal('show', modal_opts).detach().appendTo("body");

        $('#agentSubmit').on('click', () => {
            var agentsData = $('#aqm_switch').val();
            var agentsName = [];
            var agentNameShow = [];

            for (i = 0; i < agentList.length; i++) {
                for (j = 0; j < agentsData.length; j++) {
                    if (agentsData[j] == agentList[i].id) {
                        agentsName[j] = {
                            id: agentList[i].id,
                            name: agentList[i].name
                        };

                        agentNameShow[j] = agentList[i].name;
                    }
                }
            }

            $('#agentTextDelete').attr('value', agentNameShow);
            agentSelectList = agentsName;
            console.log(agentSelectList)
        });
    });

    //Boton buscar grupo
    $('#buttonGroupDelete').click('button', function (ev) {
        console.log('click on group button');
        $('#groupModalSearch').modal('show', modal_opts).detach().appendTo("body");

        $('#groupSubmit').on('click', () => {
            var groupData = $('#aqm_switch_Group').val();
            console.log(groupData)
            var groupName = [];
            var groupNameShow = [];

            for (i = 0; i < groupList.length; i++) {
                for (j = 0; j < groupData.length; j++) {
                    if (groupData[j] == groupList[i].id) {
                        groupName[j] = {
                            id: groupList[i].id,
                            name: groupList[i].name
                        };

                        groupNameShow[j] = groupList[i].name;
                    }
                }
            }
            $('#groupTextDelete').attr('value', groupNameShow);
            groupSelectList = groupName;
            console.log(groupSelectList);
        });
    });

    $('#createDeleteSubmit').click('button', function (ev) {
        if (!$("#inputNameDelete").val().trim().length > 0) {
            return alert("El campo Nombre esta vacio...")
        }

        var date = Date();
        date.toLocaleString()
        var today = moment(date).format('YYYY-MM-DDThh:mm:ss');
        var name = $('#inputNameDelete').val();
        var filters = {
            start_date: $('#fechaInicioDelete').val(),
            end_date: $('#fechaFinDelete').val(),
            logins: agentSelectList,
            group: groupSelectList
        }

        var settings = {
            "url": "https://konexo.sixbell.cloud/DeleteProcesses",
            "method": "POST",
            "timeout": 300,
            "headers": {
                "Content-Type": "application/json"
            },
            "data": JSON.stringify({
                "name": name,
                "media_type": 'voice|video',
                "created_at": today,
                "user": "",
                "filters": filters,
                "status": "new",
                "progress": 0
            })
        };

        $.ajax(settings).done(function (response) {
            console.log(response);
            toastr.success("¡Se agrego con exito!", toastr_opts);
            $('#delete_list').DataTable().ajax.reload();
        }).fail(function (response) {
            console.log(response);
            toastr.error("Ocurrió un error al validar backend", toastr_opts);
        });
    });
})

function CancelProcesses(processesRow) {
    console.log(processesRow);
    var settings = {
        "url": "https://konexo.sixbell.cloud/ProcessesDeleteList/" + processesRow,
        "method": "GET",
        "timeout": 300,
    };

    $.ajax(settings).done(function (response) {
        console.log(response);
        var settings1 = {
            "url": "https://konexo.sixbell.cloud/CancelProcesses/" + processesRow,
            "method": "PUT",
            "timeout": 300,
            "headers": {
                "Content-Type": "application/json"
            },
            "data": JSON.stringify({
                "name": response.name,
                "media_type": response.media_type,
                "created_at": response.created_at,
                "user": response.user,
                "filters": response.filters,
                "status": "cancel",
                "progress": -1
            }),
        };

        $.ajax(settings1).done(function (response) {
            console.log(response);
            toastr.success("¡Proceso cancelado!", toastr_opts);
            $('#delete_list').DataTable().ajax.reload();
        }).fail(function (response) {
            console.log(response);
            toastr.error("Ocurrió un error al validar backend", toastr_opts);
        });
    }).fail(function (response) {
        console.log(response);
        toastr.error("Ocurrió un error al validar backend", toastr_opts);
    });
};

function ViewCalls(processId) {
    console.log(processId);
    window.location.href = 'ViewCalls/'+processId;
};
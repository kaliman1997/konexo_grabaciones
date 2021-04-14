$(document).ready(function ($) {
    var agentList = {};
    var groupList = {};
    var renameList = [];
    var agentSelectList = [];
    var groupSelectList = [];
    var renameSelectList = [];

    //Configure datatable
    var process_list = $("#process_list").on('error.dt', function (e, settings, techNote, message) {
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
            url: "/ProcessesDownloadList",
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
                data: 'last_run_time',
                render: function (data, type, row) {
                    if (data == "") {
                        return ('En espera...')
                    } else {
                        return (moment(data).format('MMMM DD, hh:mm '))
                    }
                },
                sTitle: "Ultima ejecuci&oacute;n",
                defaultContent: "---",
                bSortable: false
            },
            {
                data: "",
                render: function (data, type, row) {
                    var processesRow = row._id;
                    return "<div class=\"form-group row\">" +
                        "<div class=\"col-xl-6\">" +
                        "<button type='button' class='btn btn-success btn-icon btn-icon-standalone btn-xs' onClick='EditProcesses(\"" + processesRow + "\")'>" +
                        "<i class=\"fa fa-pencil\" aria-hidden=\"true\"></i>" +
                        "<span>Editar</span>" +
                        "</button>" +
                        "</div>" +
                        "<div class=\"col-xl-6\">" +
                        "<button type='button' class='btn btn-red btn-icon btn-icon-standalone btn-xs' onClick='DeleteProcesses(\"" + processesRow + "\")'>" +
                        "<i class=\"fa fa-trash\" aria-hidden=\"true\"></i>" +
                        "<span>Borrar</span>" +
                        "</button>" +
                        "</div>" +
                        "</div>";
                },
                bSortable: false,
                sTitle: "Acciones",
                width: "180px",
                defaultContent: "---"
            }
        ]
    });

    var date = Date();
    var today = moment(date).format('YYYY-MM-DD');
    var dateTime = moment(date).format('YYYY-MM-DDThh:mm');
    var time = moment(date).format('hh:mm');
    $('#fechaFin, #fechaInicio').val(today);
    $('#dateAndTime').val(dateTime);
    $('#time').val(time);

    //Consumir MS y configuración de MultiSelect
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

    //Boton buscar agente
    $('#buttonAgent').click('button', function (ev) {
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

            $('#agentText').attr('value', agentNameShow);
            agentSelectList = agentsName;
            console.log(agentSelectList)
        });
    });

    //boton renombrar
    $('#buttonRename').click('button', function (env) {
        renameList = ["callId", "agente", "grupo", "ani", "dnis", "hora", "duración"];

        $('#aqm_switch_Rename').empty();
        $('#aqm_switch_Rename').val([""]);


        for (i = 0; i < renameList.length; i++) {
            $("#aqm_switch_Rename").append($('<option>', {
                value: renameList[i],
                text: renameList[i]
            }));
        }

        $('#aqm_switch_Rename').multiSelect({
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

        $('#renameModalSearch').modal('show', modal_opts).detach().appendTo("body");

        $('#renameSubmit').on('click', () => {
            var renameData = $('#aqm_switch_Rename').val();
            var renameName = [];

            for (i = 0; i < renameList.length; i++) {
                for (j = 0; j < renameData.length; j++) {
                    if (renameData[j] == renameList[i]) {
                        renameName[j] = renameList[i];
                    }
                }
            }

            renameSelectList = renameName;
            console.log(renameSelectList)
        });
    });


    //Boton buscar grupo
    $('#buttonGroup').click('button', function (ev) {
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
            $('#groupText').attr('value', groupNameShow);
            groupSelectList = groupName;
            console.log(groupSelectList);
        });
    });

    $('#createSubmit').click('button', function (ev) {
        if (!$("#inputNameDownload").val().trim().length > 0) {
            return alert("El campo Nombre esta vacio...")
        }
        if (!$("#inputPathDownload").val().trim().length > 0) {
            return alert("El campo Direccion Descarga esta vacio...")
        }

        var name = $("#inputNameDownload").val();
        var downloadDirectory = $("#inputPathDownload").val();
        var numDays;
        var start_date = '';
        var end_date = '';
        var modeFilters = '';
        var modeSchedule = '';
        var runTime;
        var date = Date();
        date.toLocaleString()
        var today = moment(date).format('YYYY-MM-DDThh:mm:ss');

        if ($('#checkYesterday').prop('checked')) {
            modeFilters = 'n_days';
            numDays = 1;
        }
        if ($('#checkBeforeDays').prop('checked')) {
            modeFilters = 'n_days';
            numDays = $('#numberBeforeDays').val();
        }
        if ($('#checkRangeDays').prop('checked')) {
            modeFilters = 'time_frame';
            start_date = $('#fechaInicio').val();
            end_date = $('#fechaFin').val();
        }

        var filters = {
            call_start: {
                mode: modeFilters,
                time_frame: {
                    start_date: start_date,
                    end_date: end_date
                },
                n_days: numDays
            },
            logins: agentSelectList,
            group: groupSelectList
        }

        if ($('#checkRunImmediate').prop('checked')) {
            modeSchedule = 'immediate';
            runTime = '00:00';
        }
        if ($('#checkRunEach').prop('checked')) {
            modeSchedule = 'scheduled_daily';
            runTime = $('#time').val();
        }
        if ($('#checkRunDateAndTime').prop('checked')) {
            modeSchedule = 'calendar';
            runTime = $('#dateAndTime').val();
        }

        var schedule = {
            mode: modeSchedule,
            run_time: runTime
        }
        console.log(schedule);
        var resultJSON = {
            name: name,
            created_at: today,
            status: 'new',
            user: '',
            download_directory: downloadDirectory,
            filters: filters,
            rename_order: renameSelectList,
            schedule: schedule,
            last_run_time: ''
        }

        console.log(resultJSON);
        var settings = {
            "url": "https://konexo.sixbell.cloud/DownloadProcesses",
            "method": "POST",
            "timeout": 300,
            "headers": {
                "Content-Type": "application/json"
            },
            "data": JSON.stringify({
                "name": name,
                "created_at": today,
                "status": "new",
                "user": "",
                "download_directory": downloadDirectory,
                "filters": filters,
                "rename_order": renameSelectList,
                "schedule": schedule,
                "last_run_time": ""
            })
        };

        $.ajax(settings).done(function (response) {
            console.log(response);
            toastr.success("¡Se agrego con exito!", toastr_opts);
            $('#process_list').DataTable().ajax.reload();
        }).fail(function (response) {
            console.log(response);
            toastr.error("Ocurrió un error al validar backend", toastr_opts);
        });
    });

})

function DeleteProcesses(processesRow) {
    console.log(processesRow);
    var settings = {
        "url": "https://konexo.sixbell.cloud/DeleteDownloadProcesses/" + processesRow,
        "method": "PUT",
        "timeout": 300,
    };
    $.ajax(settings).done(function (response) {
        console.log(response);
        toastr.success("¡Proceso cancelado!", toastr_opts);
        $('#process_list').DataTable().ajax.reload();
    }).fail(function (response) {
        console.log(response);
        toastr.error("Ocurrió un error al validar backend", toastr_opts);
    });
};

function EditProcesses(processesRow) {
    console.log(processesRow);

    var agentList = {};
    var groupList = {};
    var renameList = [];
    var agentSelectList = [];
    var groupSelectList = [];
    var renameSelectList = [];

    var date = Date();
    date.toLocaleString()
    var today = moment(date).format('YYYY-MM-DD');
    var dateTime = moment(date).format('YYYY-MM-DDThh:mm');
    var time = moment(date).format('hh:mm');

    var settings = {
        "url": "https://konexo.sixbell.cloud/ProcessesDownloadList/" + processesRow,
        "method": "GET",
        "timeout": 0,
    };

    $.ajax(settings).done(function (response) {
        console.log(response);
        var responseProcessesDownload = response;
        $('#inputNameDownloadModal').val(responseProcessesDownload.name);
        $('#inputPathDownloadModal').val(responseProcessesDownload.download_directory);

        switch (response.filters.call_start.mode) {
            case "time_frame":
                $('#checkRangeDaysModal').prop('checked', true);
                $('#fechaInicioModal').val(responseProcessesDownload.filters.call_start.time_frame.start_date);
                $('#fechaFinModal').val(responseProcessesDownload.filters.call_start.time_frame.end_date);
                $('#numberBeforeDaysModal').val(0);
                break
            case "n_days":
                if (responseProcessesDownload.filters.call_start.n_days <= 1) {
                    $('#checkYesterdayModal').prop('checked', true);
                    $('#numberBeforeDaysModal').val(0);
                    $('#fechaInicioModal').val(today);
                    $('#fechaFinModal').val(today);
                }
                if (response.filters.call_start.n_days > 2) {
                    $('#checkBeforeDaysModal').prop('checked', true);
                    $('#numberBeforeDaysModal').val(responseProcessesDownload.filters.call_start.n_days);
                    $('#fechaInicioModal').val(today);
                    $('#fechaFinModal').val(today);
                }
                break
        }

        var ejectType = responseProcessesDownload.schedule.mode;
        switch (ejectType) {
            case "immediate":
                console.log("immediate");
                $('#checkRunImmediateModal').prop('checked', true);
                $('#timeModal').val(time);
                $('#dateAndTimeModal').val(dateTime);
                break
            case "scheduled_daily":
                console.log("scheduled_daily");
                $('#checkRunEachModal').prop('checked', true);
                $('#timeModal').val(responseProcessesDownload.schedule.run_time);
                $('#dateAndTimeModal').val(dateTime);
                break
            case "calendar":
                console.log("calendar");
                $('#checkRunDateAndTimeModal').prop('checked', true);
                $('#timeModal').val(time);
                $('#dateAndTimeModal').val(responseProcessesDownload.schedule.run_time);
                break
            default:
                break
        }

        $('#buttonRenameModal').click('button', function (env) {
            renameList = ["callId", "agente", "grupo", "ani", "dnis", "hora", "duración"];

            $('#aqm_switch_RenameEdit').empty(true);

            for (i = 0; i < renameList.length; i++) {
                $("#aqm_switch_RenameEdit").append($('<option>', {
                    value: renameList[i],
                    text: renameList[i]
                }));
            }

            $("#aqm_switch_RenameEdit").val(responseProcessesDownload.rename_order);

            $('#aqm_switch_RenameEdit').multiSelect({
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

            $('#renameModalSearchEdit').modal('show', modal_opts).detach().appendTo("body");

            $('#renameSubmitEdit').on('click', () => {
                var renameData = $('#aqm_switch_RenameEdit').val();
                var renameName = [];

                for (i = 0; i < renameList.length; i++) {
                    for (j = 0; j < renameData.length; j++) {
                        if (renameData[j] == renameList[i]) {
                            renameName[j] = renameList[i];
                        }
                    }
                }

                renameSelectList = renameName;
                console.log(renameSelectList)
            });
        });

        $.get('/AgentList', {})
            .done(function (response, status) {
                console.log(response);
                agentList = response;
                $('#aqm_switchEdit').empty();

                for (i = 0; i < response.length; i++) {
                    $("#aqm_switchEdit").append($('<option>', {
                        value: response[i].id,
                        text: response[i].name
                    }));
                }

                var selectedValues = [];
                for (j = 0; j < responseProcessesDownload.filters.logins.length; j++) {
                    selectedValues[j] = responseProcessesDownload.filters.logins[j].id, responseProcessesDownload.filters.logins[j].name;
                }
                console.log(responseProcessesDownload.filters.logins);
                console.log(selectedValues);
                $("#aqm_switchEdit").val(selectedValues);

                $('#aqm_switchEdit').multiSelect({
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

        //Consumir MS y configuración de MultiSelect
        $.get('/GroupList', {})
            .done(function (response, status) {
                console.log(response);
                groupList = response;
                $('#aqm_switch_GroupEdit').empty();

                for (i = 0; i < response.length; i++) {
                    $("#aqm_switch_GroupEdit").append($('<option>', {
                        value: response[i].id,
                        text: response[i].name
                    }));
                }
                var selectedValues = [];
                for (j = 0; j < responseProcessesDownload.filters.group.length; j++) {
                    selectedValues[j] = responseProcessesDownload.filters.group[j].id, responseProcessesDownload.filters.group[j].name;
                }
                console.log(responseProcessesDownload.filters.group);
                console.log(selectedValues);
                $("#aqm_switch_GroupEdit").val(selectedValues);

                $('#aqm_switch_GroupEdit').multiSelect({
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

        //Boton buscar agente
        $('#buttonAgentModal').click('button', function (ev) {
            console.log('click on button agent');
            $('#agentModalSearchEdit').modal('show', modal_opts).detach().appendTo("body");

            $('#agentSubmitEdit').on('click', () => {
                var agentsData = $('#aqm_switchEdit').val();
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

                $('#agentTextModal').attr('value', agentNameShow);
                agentSelectList = agentsName;
                console.log(agentSelectList)
            });
        });

        //Boton buscar grupo
        $('#buttonGroupModal').click('button', function (ev) {
            console.log('click on group button');
            $('#groupModalSearchEdit').modal('show', modal_opts).detach().appendTo("body");

            $('#groupSubmitEdit').on('click', () => {
                var groupData = $('#aqm_switch_GroupEdit').val();
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
                $('#groupTextModal').attr('value', groupNameShow);
                groupSelectList = groupName;
                console.log(groupSelectList);
            });
        });

        $('#editSubmit').click('button', function (ev) {
            if (!$("#inputNameDownloadModal").val().trim().length > 0) {
                return alert("El campo Nombre esta vacio...")
            }
            if (!$("#inputPathDownloadModal").val().trim().length > 0) {
                return alert("El campo Direccion Descarga esta vacio...")
            }

            var name = $("#inputNameDownloadModal").val();
            var downloadDirectory = $("#inputPathDownloadModal").val();
            var numDays;
            var start_date = '';
            var end_date = '';
            var modeFilters = '';
            var modeSchedule = '';
            var runTime;
            var date = Date();
            date.toLocaleString()
            var today = moment(date).format('YYYY-MM-DDThh:mm:ss');

            if ($('#checkYesterdayModal').prop('checked')) {
                modeFilters = 'n_days';
                numDays = 1;
            }
            if ($('#checkBeforeDaysModal').prop('checked')) {
                modeFilters = 'n_days';
                numDays = $('#numberBeforeDaysModal').val();
            }
            if ($('#checkRangeDaysModal').prop('checked')) {
                modeFilters = 'time_frame';
                start_date = $('#fechaInicioModal').val();
                end_date = $('#fechaFinModal').val();
            }
            var logins;
            var groups;
            var rename;

            if (agentSelectList === null) {
                logins = agentSelectList;
                console.log('Logins ' + JSON.stringify(logins));
            } else {
                var selectedValues = [];
                for (j = 0; j < responseProcessesDownload.filters.logins.length; j++) {
                    selectedValues[j] = {
                        id: responseProcessesDownload.filters.logins[j].id,
                        name: responseProcessesDownload.filters.logins[j].name
                    };
                }
                logins = selectedValues;
                console.log('Logins ' + JSON.stringify(logins));
            }

            if (groupSelectList === null) {
                groups = groupSelectList;
                console.log('Groups ' + JSON.stringify(groups));

            } else {
                var selectedValues = [];
                for (j = 0; j < responseProcessesDownload.filters.group.length; j++) {
                    selectedValues[j] = {
                        id: responseProcessesDownload.filters.group[j].id,
                        name: responseProcessesDownload.filters.group[j].name
                    };
                }
                groups = selectedValues;
                console.log('Groups ' + JSON.stringify(groups));

            }

            if (renameSelectList === null) {
                rename = renameSelectList;
                console.log('Rename ' + JSON.stringify(rename));
            } else {
                var selectedValues = [];
                for (j = 0; j < responseProcessesDownload.rename_order.length; j++) {
                    selectedValues[j] = responseProcessesDownload.rename_order[j];
                }
                rename = selectedValues;
                console.log('Rename ' + JSON.stringify(rename));
            }

            var filters = {
                call_start: {
                    mode: modeFilters,
                    time_frame: {
                        start_date: start_date,
                        end_date: end_date
                    },
                    n_days: numDays
                },
                logins: logins,
                group: groups
            }

            if ($('#checkRunImmediateModal').prop('checked')) {
                modeSchedule = 'immediate';
                runTime = '00:00';
            }
            if ($('#checkRunEachModal').prop('checked')) {
                modeSchedule = 'scheduled_daily';
                runTime = $('#timeModal').val();
            }
            if ($('#checkRunDateAndTimeModal').prop('checked')) {
                modeSchedule = 'calendar';
                runTime = $('#dateAndTimeModal').val();
            }

            var schedule = {
                mode: modeSchedule,
                run_time: runTime
            }
            console.log(schedule);
            var resultJSON = {
                name: name,
                created_at: today,
                status: 'new',
                user: '',
                download_directory: downloadDirectory,
                filters: filters,
                rename_order: rename,
                schedule: schedule,
                last_run_time: ''
            }

            console.log(resultJSON);
            var settings = {
                "url": "https://konexo.sixbell.cloud/EditDownloadProcesses/" + processesRow,
                "method": "PUT",
                "timeout": 0,
                "headers": {
                    "Content-Type": "application/json"
                },
                "data": JSON.stringify({
                    "filters": filters,
                    "schedule": schedule,
                    "rename_order": rename,
                    "name": name,
                    "created_at": today,
                    "status": "modified",
                    "user": "",
                    "download_directory": downloadDirectory,
                    "last_run_time": ""
                })
            };

            $.ajax(settings).done(function (response) {
                console.log(response);
                toastr.success("¡Se actualizo con exito!", toastr_opts);
                $('#process_list').DataTable().ajax.reload();
            }).fail(function (response) {
                console.log(response);
                toastr.error("Ocurrió un error al validar backend", toastr_opts);
            });
        });


        $('#editDownloadModal').modal('show', modal_opts).detach().appendTo('body');
    }).fail(function (response) {
        console.log(response);
        toastr.error("Ocurrió un error al validar backend", toastr_opts);
    });
};
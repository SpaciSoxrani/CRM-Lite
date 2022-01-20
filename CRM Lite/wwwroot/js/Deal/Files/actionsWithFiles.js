
if (typeof module !== "undefined" && module !== null) {
    module.exports = Dropzone;
} else {
    window.Dropzone = Dropzone;
}

var id;
var isAnyFilesLoaded = false;
var isAnyAdditionalFilesLoaded = false;
var filesLoaded = false;
var additionalFilesLoaded = false;

Dropzone.autoDiscover = false;
Dropzone.prototype.defaultOptions.dictRemoveFileConfirmation = "Вы действительно хотите удалить файл?";
Dropzone.prototype.defaultOptions.dictDefaultMessage =
    "Нажмите для выбора файлов";
Dropzone.prototype.defaultOptions.dictFallbackMessage =
    "Ваш браузер не поддерживает drag'n'drop загрузку файлов.";
Dropzone.prototype.defaultOptions.dictFallbackText = "Пожалуйста используйте эту форму для загрузки файлов.";
Dropzone.prototype.defaultOptions.dictFileTooBig =
    "Файл слишком велик ({{filesize}}MB). Максимальный размер: {{maxFilesize}}MB.";
Dropzone.prototype.defaultOptions.dictInvalidFileType = "Неподдерживаемый тип файла.";
Dropzone.prototype.defaultOptions.dictResponseError = "Ответ сервера: {{statusCode}}.";
Dropzone.prototype.defaultOptions.dictCancelUpload = "Отменить загрузку";
Dropzone.prototype.defaultOptions.dictCancelUploadConfirmation = "Вы уверены, что хотите отменить загрузку?";
Dropzone.prototype.defaultOptions.dictRemoveFile = "<i class='fa fa-times text-danger' aria-hidden='true'></i>";
Dropzone.prototype.defaultOptions.dictMaxFilesExceeded = "Превышено максимальное количество файлов.";



function setDropzone() {
    $('.dropzone').not('.dz-clickable, .additional-files, .replace-files').each(function () {

        $(this).dropzone({
            method: "POST",
            withCredentials: true,
            url: `${api}/api/UploadAttachment`,
            paramName: "files",
            autoProcessQueue: $("#name").val() !== "",
            autoDiscover: $("#name").val() !== "",
            acceptedFiles: "image/*,application/pdf,.doc,.rar,.zip,.7z,.docx,.xls,.xlsx,.csv,.tsv,.ppt,.pptx,.pages,.odt,.rtf",
            parallelUploads: 31,
            addRemoveLinks: window.model !== undefined && window.model.dealStatus.name === "Активная",
            maxFiles: $(this).hasClass('multiple-files') ? 5 : 1,
            maxFilesize: 2000,
            createImageThumbnails: false,
            previewTemplate:
                '<div class="uploaded-image">' +
                '<div class="dz-error-message" data-dz-errormessage></div>' +
                '<strong data-dz-name></strong>' +
                '&nbsp;(<span class="dz-size" data-dz-size></span>)' +
                '<div class="dz-progress">' +
                '<span class="dz-upload" data-dz-uploadprogress></span>' +
                '</div>' +
                '</div>',

            dealId: '',

            init: function () {
                var fileId = this.element.id;
                const thisDropzone = this;

                thisDropzone.on("addedfile", function (file) {
                    if (file.isShowing) {
                        $(file.previewElement)
                            .append("<br /> <a class=\"btn download-btn dz-remove\" style=\"justify-content:flex-start; color:white; margin: 10px 0px 10px 0px;\" onclick=\"DownloadFile('" + fileId + "', '" + file.name + "') \">Скачать</a>");

                        $(file.previewElement).prop('disabled', true);
                        $(file.previewElement.parentElement).css("border-color", "#fff");
                        $(file.previewElement.parentElement).css('padding', '0px');
                    }
                    $(file.previewElement).find(".dz-progress").hide();
                    console.log(file);
                });

                thisDropzone.on('sending', function (file, xhr, formData) {

                    if ($("#name").val() === "")
                        formData.append('dealId', thisDropzone.dealId);

                    var fileCount = $('label[for="' + fileId + '"]')
                        .attr('data-file-count');

                    $('label[for="' + fileId + '"]')
                        .attr('data-file-count', +fileCount + 1);

                    formData.append('dealId', $("#name").val());
                    xhr.withCredentials = true;
                    xhr.enctype = "multipart/form-data";
                });

                dealId = encodeURIComponent($("#name").val());

                if (dealId !== "")
                    $.ajax({
                        type: "GET",
                        url: `${api}/api/File/Attachments?dealId=${dealId}&fileId=${this.element.id}`,
                        xhrFields: {
                            withCredentials: true
                        },
                        success: function (data) {
                            if ($(thisDropzone.element).hasClass('multiple-files')) {
                                if (data) {
                                    $('label[for="' + fileId + '"]')
                                        .append(" (" + data.attachmentsData.length + ")");
                                    $('label[for="' + fileId + '"]')[0].title += " (" +
                                        data.attachmentsData.length +
                                        ")";
                                    $('label[for="' + fileId + '"]')
                                        .attr('data-file-count', data.attachmentsData.length);

                                }
                            } else {
                                $.each(data.attachmentsData,
                                    function (index, item) {

                                        var mockFile = {
                                            name: item.fileName,
                                            size: item.size,
                                            isShowing: true,
                                            relativePath: item.relativePath
                                        };

                                        thisDropzone.emit("addedfile", mockFile);
                                        thisDropzone.emit("thumbnail", mockFile, item.relativePath);
                                    });
                            }
                        },
                        error: function (data) {
                            alert(data);
                        }
                    });
            },

            accept: function (file, done) {
                if (this.getAcceptedFiles() > 0) {
                    done("Naha, you don't.");
                }
                else { done(); }
            },

            sending: function (file, xhr, formData) {
                const fileId = this.element.id;
                formData.append("fileId", fileId);
                xhr.withCredentials = true;
            },

            success: function (file, r) {
                this.options.autoProcessQueue = true;
            },
            removedfile: function (file) {
                var isLastFile = !$(this.element).hasClass('multiple-files') ||
                    $(`label[for=${this.element.id}]`).attr("data-file-count") === "1";
                var isPreviewStep = !$('.active').hasClass('current-step-link');

                if (this.element[0].hasAttribute('required') && isPreviewStep && isLastFile) {
                    window.initReplaceFileDropzone(this.element, file.previewElement);
                    $('#' + this.element.id + "> .upload-btn").hide();
                    modalReplaceFile.open();
                } else {
                    var name = encodeURIComponent($("#name").val());
                    var dealId = location.href.split('/')[location.href.split('/').length - 1];

                    $(file.previewElement).find('strong[data-dz-name]')[0].outerText += " удаляется...";

                    if (dealId === "Deal") {
                        let ref = file.previewElement;
                        ref.parentNode.classList.remove('dz-max-files-reached');
                        return ref !== null
                            ? ref.parentNode.removeChild(file.previewElement)
                            : void 0;
                    } else {
                        $.ajax({
                            url: `${api}/api/File?dealId=${name}&fileType=${this.element.id}&fileName=${encodeURIComponent(file.name)}`,
                            type: 'DELETE',
                            xhrFields: {
                                withCredentials: true
                            },
                            complete: function(result) {
                                console.log(result);
                                let ref;
                                return (ref = file.previewElement) !== null
                                    ? ref.parentNode.removeChild(file.previewElement)
                                    : void 0;
                            }
                        });
                    }
                }
            },
            queuecomplete: function (file) {
                if (this.files.length === 1 && this.files[0].status === "error") {
                    console.log("Баг с автовызовом queuecomplete при загрузке" +
                        " одного файла, превышающего максимальный размер законтрен");
                    return;
                }
                console.log("All files uploaded\nNow redirecting...");

                filesLoaded = true;

                if (filesLoaded && additionalFilesLoaded && id !== undefined)
                    window.location.href = `/Deals/Deal/${id}`;
            },
            drop: null

        });
    });

    $('.additional-files').each(function () {

        $(this).dropzone({
            method: "POST",
            url: `${api}/api/File/UploadAdditionalAttachments`,
            paramName: "files",
            withCredentials: true,
            autoProcessQueue: $("#name").val() !== "",
            autoDiscover: $("#name").val() !== "",
            acceptedFiles: "image/*,application/pdf,.doc,.rar,.zip,.7z,.docx,.xls,.xlsx,.csv,.tsv,.ppt,.pptx,.pages,.odt,.rtf",
            parallelUploads: 31,
            addRemoveLinks: true,
            maxFiles: 5,
            maxFilesize: 2000,
            createImageThumbnails: false,
            previewTemplate:
                '<div class="uploaded-image">' +
                '<div class="dz-error-message" data-dz-errormessage></div>' +
                '<strong data-dz-name></strong>' +
                '&nbsp;(<span class="dz-size" data-dz-size></span>)' +
                '<div class="dz-progress">' +
                '<span class="dz-upload" data-dz-uploadprogress></span>' +
                '</div>' +
                '</div>',

            dealName: '',

            init: function () {
                var fileId = this.element.id;
                const thisDropzone = this;

                thisDropzone.on("addedfile", function (file) {
                    if (file.isShowing) {
                        $(file.previewElement)
                            .append("<br /> <a class=\"btn download-btn dz-remove\" style=\"justify-content:flex-start; color:white; margin: 10px 0px 10px 0px;\" onclick=\"DownloadFile('" + fileId + "', '" + file.name + "') \">Скачать</a>");

                        $(file.previewElement).prop('disabled', true);
                        $(file.previewElement.parentElement).css("border-color", "#fff");
                        $(file.previewElement.parentElement).css('padding', '0');
                    }
                    $(file.previewElement).find(".dz-progress").hide();
                    console.log(file);
                });

                thisDropzone.on('sending', function (file, xhr, formData) {
                    if ($("#name").val() === "")
                        formData.append('dealName', thisDropzone.dealName);

                    formData.append('dealName', $("#name").val());
                    xhr.withCredentials = true;
                    xhr.enctype = "multipart/form-data";
                });

                if ($("#name").val() !== "")
                    $.ajax({
                        type: "GET",
                        url: `${api}/api/File/AdditionalAttachements?dealName=${dealId}`,
                        xhrFields: {
                            withCredentials: true
                        },
                        success: function (data) {
                            if (data) {

                                if ($('label[for="additional-files"]')[0].title === "Дополнительные файлы") {
                                    $('label[for="additional-files"]').append(" (" + data.attachmentsData.length + ")");
                                    $('label[for="additional-files"]')[0].title += " (" +
                                        data.attachmentsData.length +
                                        ")";
                                }
                            }
                        },
                        error: function (data) {
                            alert(data);
                        }
                    });
            },

            accept: function (file, done) {
                if (this.getAcceptedFiles() > 0) {
                    done("Naha, you don't.");
                }
                else { done(); }
            },

            success: function (file, r) {
                this.options.autoProcessQueue = true;
            },

            removedfile: function (file) {
                var files = this.files;
                var name = encodeURIComponent($("#name").val());
                var dealId = location.href.split('/')[location.href.split('/').length - 1];

                $(file.previewElement).find('strong[data-dz-name]')[0].outerText += " удаляется...";

                if (dealId === "Deal") {
                    let ref = file.previewElement;
                    ref.parentNode.classList.remove('dz-max-files-reached');
                    return ref !== null
                        ? ref.parentNode.removeChild(file.previewElement)
                        : void 0;
                } else {
                        $.ajax({
                            url: `${api}/api/File/AdditionalFile?dealId=${name}&fileName=${encodeURIComponent(file.name)}`,
                            type: 'DELETE',
                            xhrFields: {
                                withCredentials: true
                            },
                            complete: function (result) {
                                console.log(result);
                                let ref;
                                return (ref = file.previewElement) !== null
                                    ? ref.parentNode.removeChild(file.previewElement)
                                    : void 0;
                            }
                        });
                }

            },

            queuecomplete: function (file) {
                if (this.files.length === 1 && this.files[0].status === "error") {
                    console.log("Баг с автовызовом queuecomplete при загрузке" +
                        " одного файла, превышающего максимальный размер законтрен");
                    return;
                }

                additionalFilesLoaded = true;

                if (filesLoaded && additionalFilesLoaded && id !== undefined)
                    window.location.href = `/Deals/Deal/${id}`;
            },
            drop: null

        });
    });
}

function GetDealName(dealViewModel, data) {
    $.ajax({
        type: "POST",
        url: `${api}/api/DealName`,
        data: {
            organizationId: dealViewModel.organizationId,
            dealShortName: dealViewModel.shortName,
            fullDealName: dealViewModel.name
        },
        xhrFields: {
            withCredentials: true
        },
        success: function (data) {
            let dz = $(".dropzone").not('.additional-files, .replace-files');
            if (dz[0].dropzone.options.autoProcessQueue === true) {
                filesLoaded = true;
            } else {
                for (var i = 0; i < dz.length; i++) {
                    dz[i].dropzone.dealId = data;
                    if (dz[i].dropzone.files.length > 0)
                        isAnyFilesLoaded = true;
                    dz[i].dropzone.processQueue();

                }
            }

            let dzAdditional = $(".additional-files");

            if (dzAdditional[0].dropzone.options.autoProcessQueue === true) {
                additionalFilesLoaded = true;
            } else {
                for (var k = 0; k < dzAdditional.length; k++) {
                    if (dzAdditional[k].dropzone.files.length > 0)
                        isAnyAdditionalFilesLoaded = true;

                    dzAdditional[k].dropzone.dealName = data;
                    dzAdditional[k].dropzone.processQueue();

                }
            }
        },
        error: function (data) {
            alert(data);
        }
    })
        .done(function () {
            id = data.id;

            if (!isAnyFilesLoaded)
                filesLoaded = true;

            if (!isAnyAdditionalFilesLoaded)
                additionalFilesLoaded = true;

            if (!isAnyFilesLoaded && !isAnyAdditionalFilesLoaded)
                window.location.href = `/Deals/Deal/${data.id}`;
        });
}

function GetSurvey() {
    var aq = $('#verification-step-product-line').val();
    let count = 0;
    $.ajax({
        type: "POST",
        url: `${api}/api/Survey`,
        data: JSON.stringify(aq),
        contentType: "application/json",
        success: function (data) {
            count = data.length;
            return count;
        },
        error: function (data) { console.log(data); },
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        }
    }).done(function (data) {
        var show = document.getElementById("verification-step-file-show-survey");

        if (count === 0)
            show.style.display = 'none';
        else
            show.style.display = 'block';
    })
}

function GetSurveys() {
    var list = $('#verification-step-product-line').val();
    var surveys;
    $.ajax({
        type: "POST",
        url: `${api}/api/Survey`,
        data: JSON.stringify(list),
        contentType: "application/json",
        success: function (data) {
            surveys = data;

            var content = $('#surveys-content');
            content.empty();
            for (var i = 0; i < surveys.length; i++)
                content.append("<div class=\"col-md-8\" style=\"padding-top: 0px;\"> <a>" +
                    surveys[i].fileName +
                    "</a> 	</div>" +
                    "<div class=\"col-md-4\" style=\"padding-top:0px;\">	<a class=\"btn download-btn\" style=\"justify-content:flex-start; color: white; margin: 10px 0px 10px 0px;\" onclick=\"DownloadSurvey('" +
                    surveys[i].fileName + "', '" + surveys[i].lineName +
                    "') \">Скачать</a>	</div>");

            var modal = new RModal(document.getElementById('survey'));
            window.modal = modal;
            modal.open();

        },
        error: function (data) { console.log(data); },
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        }
    });
}

function GetAllOldFiles(model, id) {

    $.ajax({
        type: "GET",
        url: `${api}/api/File/OldFiles?dealId=${model.id}`,
        xhrFields: {
            withCredentials: true
        },
        success: function (data) {
            files = data;
            var content = $('#files-content-' + id);
            if (data !== "Files not found") {

                files.sort(function (a, b) {
                    a = a.date;
                    b = b.date;

                    return a > b ? -1 : (a < b ? 1 : 0);
                });

                for (i = 0; i < files.length; i++) {
                    var stepName = "Выгружено из старой CRM";

                    var deleteBlock = window.model.dealStatus.name === "Активная"
                        ? "<div class=\"col-md-1\" style=\"padding-top:0px;\">	<a class=\"\" style=\"justify-content:flex-start; cursor:pointer !important; color: white; margin: 10px 0px 10px 0px;\" onclick=\"DeleteOldFile('" +
                        files[i].id +
                        "', this) \"><i class='fa fa-times text-danger' aria-hidden='true'></i></a>	</div>"
                        : "";

                    content.append(
                        "<div class=\"col-md-12 row mb-3\"> " +
                        "<div class=\"col-md-2\" style=\"padding-top: 0px;\"> <a>" +
                        files[i].fileName +
                        "</a> 	</div>" +
                        "<div class=\"col-md-2\" style=\"padding-top: 0px;\"> <a>" +
                        stepName +
                        "</a> 	</div>" +
                        "<div class=\"col-md-1\" style=\"padding-top: 0px;\"> <a>" +
                        files[i].size +
                        "</a> 	</div>" +
                        "<div class=\"col-md-1\" style=\"padding-top: 0px;\"> <a>" +
                        FormatDate(files[i].date) +
                        "</a> 	</div>" +
                        "<div class=\"col-md-1\" style=\"padding-top: 0px;\"> <a>" +
                        "Не указан" +
                        "</a> 	</div>" +
                        "<div class=\"col-md-2\" style=\"padding-top:0px;\">	<a class=\"btn download-btn\" style=\"justify-content:flex-start; color: white; margin: 0px 0px 10px 0px;\" onclick=\"PreviewFile('" +
                        files[i].id + "', '" + files[i].fileName + "', '/GetOldFile'" +
                        ") \">Предпросмотр</a>	</div>" +
                        "<div class=\"col-md-2\" style=\"padding-top:0px;\">	<a class=\"btn download-btn\" style=\"justify-content:flex-start; color: white; margin: 0px 0px 10px 0px;\" onclick=\"DownloadOldFile('" +
                        files[i].id +
                        "') \">Скачать</a>	</div>"
                        + deleteBlock + "</div>");

                }
            }

            GetAllAdditionalFiles(model, id);

        },
        error: function (data) { console.log(data); },
        dataType: 'json'
    });
}

function GetAllAdditionalFiles(model, id) {

    $.ajax({
        type: "GET",
        url: `${api}/api/File/AdditionalFiles?dealId=${model.id}`,
        xhrFields: {
            withCredentials: true
        },
        success: function (data) {
            files = data;
            var content = $('#files-content-' + id);

            if (data !== "Files not found") {
                files.sort(function (a, b) {
                    a = a.date;
                    b = b.date;

                    return a > b ? -1 : (a < b ? 1 : 0);
                });

                for (var i = 0; i < files.length; i++) {
                    var stepName = "Дополнительные файлы";
                    if (files[i].addedAfterClosing)
                        stepName = "Доп. файлы / добавлено после закрытия сделки";

                    var deleteBlock = window.model.dealStatus.name === "Активная"
                        ? "<div class=\"col-md-1\" style=\"padding-top:0px;\">	<a class=\"\" style=\"justify-content:flex-start; cursor:pointer !important; color: white; margin: 10px 0px 10px 0px;\" onclick=\"DeleteAdditionalFile('" +
                        files[i].id +
                        "', this) \"><i class='fa fa-times text-danger' aria-hidden='true'></i></a>	</div>"
                        : "";

                    var authorName = files[i].authorName === null ? "Не указан" : files[i].authorName;

                    content.append("<div class=\"col-md-12 row mb-3\">" +
                        "<div class=\"col-md-2\" style=\"padding-top: 0px;\"> <a>" +
                        files[i].fileName +
                        "</a> 	</div>" +
                        "<div class=\"col-md-2\" style=\"padding-top: 0px;\"> <a>" +
                        stepName +
                        "</a> 	</div>" +
                        "<div class=\"col-md-1\" style=\"padding-top: 0px;\"> <a>" +
                        files[i].size +
                        "</a> 	</div>" +
                        "<div class=\"col-md-1\" style=\"padding-top: 0px;\"> <a>" +
                        FormatDate(files[i].date) +
                        "</a> 	</div>" +
                        "<div class=\"col-md-1\" style=\"padding-top: 0px;\"> <a>" +
                        authorName +
                        "</a> 	</div>" +
                        "<div class=\"col-md-2\" style=\"padding-top:0px;\">	<a class=\"btn download-btn\" style=\"justify-content:flex-start; color: white; margin: 0px 0px 10px 0px;\" onclick=\"PreviewFile('" +
                        files[i].id + "', '" + files[i].fileName + "', '/GetAdditionalFile'" +
                        ") \">Предпросмотр</a>	</div>" +
                        "<div class=\"col-md-2\" style=\"padding-top:0px;\">	<a class=\"btn download-btn\" style=\"justify-content:flex-start; color: white; margin: 0px 0px 10px 0px;\" onclick=\"DownloadAdditionalFile('" +
                        files[i].id +
                        "') \">Скачать</a>	</div>"
                        + deleteBlock + "</div>");

                }
            }

            GetAllCloudLinks(model, id);

        },
        error: function (data) { console.log(data); },
        dataType: 'json'
    });
}

function GetAllCloudLinks(model, id) {

    $.ajax({
        type: "GET",
        url: `${api}/api/File/CloudLinks?dealId=${model.id}`,
        xhrFields: {
            withCredentials: true
        },
        success: function (data) {
            var files = data;
            var content = $('#files-content-' + id);

            if (data.length === 0 && content.children().length === 0) {
                content.append(
                    "<div class=\"col-md-12 row\"><div class=\"col-md-12\" style=\"text-align: center;\"> <a>Файлы отсутствуют</a> </div>	</div>");

            } else if (data.length > 0) {

                files.sort(function (a, b) {
                    a = a.creationDate;
                    b = b.creationDate;

                    return a > b ? -1 : (a < b ? 1 : 0);
                });

                for (var i = 0; i < files.length; i++) {

                    var stepName = "";

                    var linkFile = $('#' + files[i].linkName.replace("-cloud", "")).siblings("label");
                    var linkName = "";

                    if (linkFile.length === 0)
                        linkName = "Дополнительный файл";
                    else
                        linkName = linkFile.text();

                    var deleteBlock = window.model.dealStatus.name === "Активная"
                        ? "<div class=\"col-md-1\" style=\"padding-top:0px;\">	<a class=\"\" style=\"justify-content:flex-start; cursor:pointer !important; color: white; margin: 10px 0px 10px 0px;\" onclick=\"DeleteCloudLinkInList('" +
                        files[i].linkName +
                        "', this) \"><i class='fa fa-times text-danger' aria-hidden='true'></i></a>	</div>"
                        : "";

                    var authorName = files[i].authorName === null ? "Не указан" : files[i].authorName;

                    content.append("<div class=\"col-md-12 row mb-3\">" +
                        "<div class=\"col-md-2\" style=\"padding-top: 0px;\"> <a>" +
                        linkName +
                        "</a> 	</div>" +
                        "<div class=\"col-md-2\" style=\"padding-top: 0px;\"> <a>" +
                        stepName +
                        "</a> 	</div>" +
                        "<div class=\"col-md-1\" style=\"padding-top: 0px;\"> <a>" +
                        "" +
                        "</a> 	</div>" +
                        "<div class=\"col-md-1\" style=\"padding-top: 0px;\"> <a>" +
                        FormatDate(files[i].creationDate) +
                        "</a> 	</div>" +
                        "<div class=\"col-md-1\" style=\"padding-top: 0px;\"> <a>" +
                        authorName +
                        "</a> 	</div>" +
                        "<div class=\"col-md-2\" style=\"padding-top:0px;\"></div>" +
                        "<div class=\"col-md-2\" style=\"padding-top:0px;\">	<a class=\"font-weight-bold\" style=\"justify-content:flex-start; margin: 0px 0px 10px 0px;\" target=\"_blank\" href=\"" +
                        files[i].link +
                        "\">Cсылка на Hostco Cloud</a>	</div>" + deleteBlock + "</div > ");

                }
            }

            var modal = new RModal(document.getElementById('all-files-' + id));
            window.modal = modal;
            modal.open();

        },
        error: function (data) { console.log(data); },
        dataType: 'json'
    });
}

function GetAllFiles(id) {
    var model = {};
    model.id = location.href.split('/')[location.href.split('/').length - 1];

    if ((model.id === "Deal") || (model.id === ""))
        return;

    $.ajax({
        type: "GET",
        url: `${api}/api/File/Deals/${model.id}`,
        data: JSON.stringify(model),
        contentType: "application/json",
        xhrFields: {
            withCredentials: true
        },
        success: function (data) {
            files = data;
            var content = $('#files-content-' + id);
            content.empty();
            if (data !== "Files not found") {
                files.sort(function (a, b) {
                    a = a.date;
                    b = b.date;

                    return a > b ? -1 : (a < b ? 1 : 0);
                });

                var deleteColumn = window.model.dealStatus.name === "Активная"
                    ? "<div class=\"col-md-1\" style=\"padding-top: 0px;\"> <b></b> 	</div>"
                    : "";


                    content.append("<div class=\"col-md-12 row mb-3\"> " +
                        "<div class=\"col-md-2\" style=\"padding-top: 0px;\"> <b>Имя файла</b> 	</div>" +
                        "<div class=\"col-md-2\" style=\"padding-top: 0px;\"> <b>Этап</b> 	</div>" +
                        "<div class=\"col-md-1\" style=\"padding-top: 0px;\"> <b>Размер файла</b> 	</div>" +
                        "<div class=\"col-md-1 pr-0\" style=\"padding-top: 0px;\"> <b>Дата изменения</b> 	</div>" +
                        "<div class=\"col-md-1\" style=\"padding-top: 0px;\"> <b>Автор</b> 	</div>" +
                        "<div class=\"col-md-2\" style=\"padding-top: 0px;\"> <b></b> 	</div>" +
                        "<div class=\"col-md-2\" style=\"padding-top: 0px;\"> <b></b> 	</div>" +
                        deleteColumn + "</div>");

                var $label = $("label[for='" + files[0].id + "']");

                for (var i = 0; i < files.length; i++) {
                    var piecesOfName = files[i].fileName.split('.');
                    var exp = '.' + piecesOfName[piecesOfName.length - 1];

                    var piecesOfId = files[i].id.split('-');
                    var stepName = GetStepNumber(piecesOfId[0]);

                    if (stepName === "")
                        continue;

                    var deleteBlock = window.model.dealStatus.name === "Активная"
                        ? "<div class=\"col-md-1\" style=\"padding-top:0px;\">	<a class=\"\" style=\"justify-content:flex-start; cursor:pointer !important; color: white; margin: 10px 0px 10px 0px;\" onclick=\"DeleteFile('" +
                        files[i].id +
                        "', this, '" + files[i].fileName + "') \"><i class='fa fa-times text-danger' aria-hidden='true'></i></a>	</div>"
                        : "";

                    var authorName = files[i].authorName === null ? "Не указан" : files[i].authorName;

                    content.append(
                        "<div class=\"col-md-12 row mb-3\"> " +
                        "<div class=\"col-md-2\" style=\"padding-top: 0px;\"> <a>" +
                        files[i].fileName +
                        "</a> 	</div>" +
                        "<div class=\"col-md-2\" style=\"padding-top: 0px;\"> <a>" +
                        stepName +
                        "</a> 	</div>" +
                        "<div class=\"col-md-1\" style=\"padding-top: 0px;\"> <a>" +
                        files[i].size +
                        "</a> 	</div>" +
                        "<div class=\"col-md-1\" style=\"padding-top: 0px;\"> <a>" +
                        FormatDate(files[i].date) +
                        "</a> 	</div>" +
                        "<div class=\"col-md-1\" style=\"padding-top: 0px;\"> <a>" +
                        authorName +
                        "</a> 	</div>" +
                        "<div class=\"col-md-2\" style=\"padding-top:0px;\">	<a class=\"btn download-btn\" style=\"justify-content:flex-start; color: white; margin: 0px 0px 10px 0px;\" onclick=\"PreviewFile('" +
                        files[i].id + "', '" + files[i].fileName + "', ''" +
                        ") \">Предпросмотр</a>	</div> " +
                        "<div class=\"col-md-2\" style=\"padding-top:0px;\">	<a class=\"btn download-btn\" style=\"justify-content:flex-start; color: white; margin: 0px 0px 10px 0px;\" onclick=\"DownloadFile('" +
                        files[i].id + "', '" + files[i].fileName +
                        "') \">Скачать</a>	</div> " +
                        deleteBlock +
                        "</div>");

                }
            }

            GetAllOldFiles(model, id);

        },
        error: function (data) { console.log(data); },
        dataType: 'json'
    });
}

function GetStepNumber(stepName) {
    let name = "";

    switch (stepName) {
        case "verification":
            return "Верификация потребности";
        case "development":
            return "Разработка проекта технического решения";
        case "negotiating":
            return "Согласование решения";
        case "contest":
            return "Конкурсная процедура";
        case "signed":
            return "Подписание контракта";
        case "works":
            return "Работа по контракту";
    }
    return name;
}

function DownloadSurvey(fileName, lineName) {
    window.location.href = `${api}/api/Survey/${fileName}/${lineName}`;
}

function DeleteCloudLinkInList(linkName, el) {
    var dealId = location.href.split('/')[location.href.split('/').length - 1];

    if (confirm("Вы действительно хотите удалить ссылку на облако?"))
        $.ajax({
            url: `${api}/api/File/CloudLinks?dealId=${dealId}&linkName=${linkName}`,
            type: 'DELETE',
            xhrFields: {
                withCredentials: true
            },
            complete: function (result) {
                console.log(result);
                $(el).closest('.row').remove();
            }
        });
}

function DeleteFile(fileid, el, fileName) {
    var name = encodeURIComponent($("#name").val());
    var dropzoneElem = $('#' + fileid)[0];

    if (confirm("Вы действительно хотите удалить файл?")) {
        let isLastFile = !$(dropzoneElem).hasClass('multiple-files') ||
            $(`label[for=${fileid}]`).attr("data-file-count") === "1";
        let isPreviewStep = GetStepNumber(fileid.split('-')[0]) !== model.step.name;

        if (dropzoneElem[0].hasAttribute('required') && isPreviewStep && isLastFile) {
            window.initReplaceFileDropzone(dropzoneElem, $('#' + fileid + ' .uploaded-image')[0]);
            if (!$(dropzoneElem).hasClass('multiple-files'))
                $('#' + fileid + "> .upload-btn").hide();
            modalReplaceFile.open();
            modal.close();
        } else {
            $.ajax({
                url: `${api}/api/File?dealId=${name}&fileType=${fileid}&fileName=${encodeURIComponent(fileName)}`,
                type: 'DELETE',
                xhrFields: {
                    withCredentials: true
                },
                complete: function(result) {
                    console.log(result);
                    $(el).closest('.row').remove();
                    $('#' + fileid + ' .uploaded-image').remove();
                    $('#' + fileid + ' input').addClass('d-block');
                    if ($(dropzoneElem).hasClass('multiple-files')) {
                        let fileCount = $(`label[for=${fileid}]`)
                            .attr('data-file-count');

                        $(`label[for=${fileid}]`)
                            .attr('data-file-count', `${+fileCount - 1}`);
                    }

                }
            });
        }
    }
}

function DeleteOldFile(fileid, el) {
    var name = encodeURIComponent($("#name").val());

    if (confirm("Вы действительно хотите удалить файл?"))
        $.ajax({
            url: `${api}/api/File/OldFile?dealId=${name}&fileName=${fileid}`,
            type: 'DELETE',
            xhrFields: {
                withCredentials: true
            },
            complete: function (result) {
                console.log(result);
                $(el).closest('.row').remove();
            }
        });
}

function DeleteAdditionalFile(fileid, el) {
    var name = encodeURIComponent($("#name").val());

    if (confirm("Вы действительно хотите удалить файл?"))
        $.ajax({
            url: `${api}/api/File/AdditionalFile?dealId=${name}&fileName=${fileid}`,
            type: 'DELETE',
            xhrFields: {
                withCredentials: true
            },
            complete: function (result) {
                console.log(result);
                $(el).closest('.row').remove();
            }
        });
}

function DownloadFile(fileType, fileName) {
    var dealId = location.href.split('/')[location.href.split('/').length - 1];
    window.location.href = `${api}/api/File/${dealId}/${fileType}/${fileName}`;
}

function DownloadOldFile(fileName) {
    var dealId = location.href.split('/')[location.href.split('/').length - 1];
    window.location.href = `${api}/api/File/GetOldFile/${dealId}/${fileName}`;
}

function DownloadAdditionalFile(fileName) {
    var dealId = location.href.split('/')[location.href.split('/').length - 1];
    window.location.href = `${api}/api/File/GetAdditionalFile/${dealId}/${fileName}`;
}

function PreviewFile(fileId, fileName, fileType) {
    var dealId = location.href.split('/')[location.href.split('/').length - 1];
    window.createPreviewWindow(`${api}/api/File${fileType}/${dealId}/${fileId}`, fileName);
}

function FormatDate(data) {

    var date = new Date(data);
    var dd = date.getDate();
    var mm = date.getMonth() + 1;
    var yy = date.getFullYear();
    var h = date.getHours();
    var m = date.getMinutes();

    dd = checkTime(dd);
    mm = checkTime(mm);
    yy = checkTime(yy);
    h = checkTime(h);
    m = checkTime(m);

    return dd + '.' + mm + '.' + yy + ' ' + h + ":" + m;
}
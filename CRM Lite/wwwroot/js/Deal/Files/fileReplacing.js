$(document).ready(function () {
    var modal = new RModal(document.getElementById('modal-replace-file'), {
        beforeOpen: function (next) {
            next();
        }

        , beforeClose: function (next) {
            next();
        }
    });

    document.addEventListener('keydown', function (ev) {
        modal.keydown(ev);
    }, false);

    window.modalReplaceFile = modal;
});

function initReplaceFileDropzone(dropzoneElement, previewElement) {
    $('.replace-files').each(function () {

        $(this).dropzone({
            method: "PUT",
            withCredentials: true,
            url: `${api}/api/File/Replace`,
            paramName: "files",
            autoProcessQueue: true,
            autoDiscover: true,
            acceptedFiles: "image/*,application/pdf,.doc,.rar,.zip,.7z,.docx,.xls,.xlsx,.csv,.tsv,.ppt,.pptx,.pages,.odt,.rtf",
            parallelUploads: 31,
            maxFiles: $(dropzoneElement).hasClass('multiple-files') ? 5 : 1,
            maxFilesize: 30,
            createImageThumbnails: true,

            dealId: '',

            sending: function (file, xhr, formData) {
                const fileId = dropzoneElement.id;

                formData.append("fileId", fileId);
                formData.append("dealId", model.id);
                xhr.withCredentials = true;
            },

            success: function (file, r) {
                if (!$(dropzoneElement).hasClass('multiple-files')) {
                    $(previewElement).remove();
                    let size = $(file.previewElement).children('.dz-details').children('.dz-size').html();
                    $(dropzoneElement).append(
                        `<div class="uploaded-image dz-image-preview"><div class="dz-error-message" data-dz-errormessage=""></div>
                        <strong data-dz-name="">${file.name}</strong>&nbsp;(${size})
                        <div class="dz-progress" style="display: none;"><span class="dz-upload" data-dz-uploadprogress=""></span></div>
                        <a class="dz-remove" href="javascript:undefined;" data-dz-remove=""><i class="fa fa-times text-danger" aria-hidden="true"></i></a><br>
                        <a class="btn download-btn dz-remove" style="justify-content:flex-start; color:white; margin: 10px 0px 10px 0px;" 
                        onclick="DownloadFile('${dropzoneElement.id}', '${file.name}') ">Скачать</a></div>`);
                }
                this.destroy();
                setTimeout(modalReplaceFile.close(), 1000);

            },
            drop: null

        });
    });
}
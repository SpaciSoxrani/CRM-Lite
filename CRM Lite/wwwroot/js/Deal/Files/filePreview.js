$(document).ready(function () {
    var modal = new RModal(document.getElementById('modal-preview-file'), {
        beforeOpen: function (next) {
            next();
        }

        , beforeClose: function (next) {
            window.docEditor.destroyEditor();
            next();
        }
    });

    document.addEventListener('keydown', function (ev) {
        modal.keydown(ev);
    }, false);

    window.modalPreviewFile = modal;
});

var createPreviewWindow = (fileLink, fileName) => {
    var extension = getExtensionFromFileName(fileName);
    var key = generateRandomCode();

    if (!fileLink.includes("GetAdditionalFile"))
        fileLink = fileLink + "/" + fileName;

    window.docEditor = new DocsAPI.DocEditor("preview-block", {
        "document": {
            "fileType": extension,
            "key": key,
            "title": fileName,
            "url": fileLink
        },
        "documentType": defineDocumentType(extension),
        "type": "embedded",
        "editorConfig": {
            "mode": "view"
        },
        "height": "100%",
        "width": "100%"
    });

    modalPreviewFile.open();
};

var generateRandomCode = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

var getExtensionFromFileName = (fileName) => {
    var fileNameArray = fileName.split('.');
    return fileNameArray[fileNameArray.length - 1];
};

var defineDocumentType = (fileExtension) => {
    var textExtensions =
        "doc, docm, docx, dot, dotm, dotx, epub, fodt, htm, html, mht, odt, ott, pdf, rtf, txt, djvu, xps"
            .split(', ');

    if (textExtensions.includes(fileExtension))
        return "text";

    var spreadsheetExtensions =
        "csv, fods, ods, ots, xls, xlsm, xlsx, xlt, xltm, xltx"
            .split(', ');

    if (spreadsheetExtensions.includes(fileExtension))
        return "spreadsheet";

    var presentationExtensions =
        "fodp, odp, otp, pot, potm, potx, pps, ppsm, ppsx, ppt, pptm, pptx"
            .split(', ');

    if (presentationExtensions.includes(fileExtension))
        return "presentation";
};


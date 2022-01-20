var imageId = "";

function addImageModal() {
    var modal = new RModal(document.getElementById('modal-add-image'), {
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

    let inputs = document.querySelectorAll('.input__file');
    Array.prototype.forEach.call(inputs, function (input) {
        let label = input.nextElementSibling,
            labelVal = label.querySelector('.input__file-button-text').innerText;

        input.addEventListener('change', function (e) {
            let countFiles = '';
            if (this.files && this.files.length >= 1)
                countFiles = this.files.length;

            if (countFiles)
                label.querySelector('.input__file-button-text').innerText = 'Выбрано файлов: ' + countFiles;
            else
                label.querySelector('.input__file-button-text').innerText = labelVal;
        });
    });
}

function loadImage(el) {
    if (el.files && el.files[0]) {
        var reader = new FileReader();
        reader.onload = imageIsLoaded;
        reader.readAsDataURL(el.files[0]);
    }
}

function loadImageLink() {
    let imageLink = $('#file-link-button').val().trim();
    if (imageLink !== "") {
        $(`#img-for-${imageId}`).attr('src', imageLink);
        setTimeout(() => {
            let imgHeight = $(`#img-for-${imageId}`).height() + "px";
            let imgWidth = $(`#img-for-${imageId}`).width() + "px";
            window.mjmlManager.changePropValue(imageId, "src", imageLink);
            window.mjmlManager.changePropValue(imageId, "height", imgHeight);
            window.mjmlManager.changePropValue(imageId, "width", imgWidth);
            $('#file-link-button').val("");
            },
            1000);
        
        modalReplaceFile.close();
    }
}

function imageIsLoaded(e) {
    $('.input__file-button-text').text("Выберите файл");
    $(`#img-for-${imageId}`).attr('src', e.target.result);
    setTimeout(() => {
            let imgHeight = $(`#img-for-${imageId}`).height() + "px";
            let imgWidth = $(`#img-for-${imageId}`).width() + "px";
            window.mjmlManager.changePropValue(imageId, "src", e.target.result);
            window.mjmlManager.changePropValue(imageId, "height", imgHeight);
            window.mjmlManager.changePropValue(imageId, "width", imgWidth);
        },
        1000);
    modalReplaceFile.close();
};

function closeImageModal() {
    window.mjmlManager.deleteMjmlElement(imageId, true);
    modalReplaceFile.close();
}
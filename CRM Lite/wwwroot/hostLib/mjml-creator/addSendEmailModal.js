
function addSendEmailModal() {
    var modal = new RModal(document.getElementById('modal-send-email'), {
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

    window.modalSendEmail = modal;
}
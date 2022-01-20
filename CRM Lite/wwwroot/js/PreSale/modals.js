function openModalNew() {
    if (!window.modalNew)
    {
        let modal = new RModal(document.getElementById('modal-new'), {

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
        window.modalNew = modal;
    }
    window.modalNew.open();
}

function closeModalNew() {
    window.modalNew.close();
}

function openModalAccess() {
    if (!window.modalAccess) {
        let modal = new RModal(document.getElementById('modal-access'), {

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
        window.modalAccess = modal;
    }
    window.modalAccess.open();
}

function closeModalAccess() {
    window.modalAccess.close();
}
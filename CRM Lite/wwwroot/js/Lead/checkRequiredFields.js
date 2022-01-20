var formIsValid = false;

function checkRequiredFields() {
    clearRequiredFields()

    $(`.input-group input[required],
			.input-group select[required],
				.input-group textarea[required]`).each(function () {

        const element = $(this);

        switch (element.prop("tagName")) {
            case "INPUT":
                if (element.prop("type") === "checkbox") {
                    if (!element.prop("checked"))
                        highlightRequiredElementBlock(element);

                } else {
                    if (element.prop("type") === "button") {
                        if (element[0].form.innerText === "")
                            highlightRequiredElementBlock(element);
                    } else
                        if (element.val() === "")
                            highlightRequiredElementBlock(element);
                }
                break;

            case "SELECT":
                if (element.val() === null || Array.isArray(element.val()) && !element.val().length || element.val() === '') {
                    highlightRequiredElementBlock(element);
                }
                break;

            case "TEXTAREA":
                if (element.val() === "")
                    highlightRequiredElementBlock(element);
                break;
        }
    });

    return formIsValid;
}

function clearRequiredFields() {
    $(`.input-group input[required],
                .input-group select[required],
					.input-group textarea[required]`).each(function () {
        const element = $(this);
            if (element[0].classList.contains('selectpicker')) {
            element.selectpicker('setStyle', 'btn-outline-danger', 'remove');
            element.selectpicker('setStyle', 'btn-gray', 'add');
        }
        else if (element[0].classList.contains('is-invalid'))
            element[0].classList.remove('is-invalid');
    });

    formIsValid = true;
}

function highlightRequiredElementBlock(element) {
    formIsValid = false;
    if (element[0].classList.contains('selectpicker')) {
        element.selectpicker('setStyle', 'btn-gray', 'remove');
        element.selectpicker('setStyle', 'btn-outline-danger', 'add');
    }
    else
        element[0].classList.add("is-invalid");
}
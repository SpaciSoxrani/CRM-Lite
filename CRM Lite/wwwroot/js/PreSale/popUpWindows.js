var confirmButtonColor = "#20a8d8";

function showErrorWindow(status) {
    if (status === 403) {
        Swal.fire({
            title: "У Вас нет доступа к данному объекту!",
            icon: "error",
            confirmButtonColor: confirmButtonColor
        });
        return;
    } else {
        Swal.fire({
            title: "Неизвестная ошибка, обратитесь к администратору системы",
            icon: "error",
            confirmButtonColor: confirmButtonColor
        });
    }
}

const requestSuccessful = Swal.mixin({
    title: "Успешно сохранено!",
    icon: "success",
    confirmButtonColor: confirmButtonColor
});

const requestSuccessfulTimer = Swal.mixin({
    title: "Успешно сохранено!",
    icon: "success",
    position: "top",
    confirmButtonColor: confirmButtonColor,
    backdrop: false,
    showConfirmButton: false,
    timer: 1500
});

const formIsInvalid = Swal.mixin({
    title: "Заполните необходимые поля!",
    icon: "warning",
    confirmButtonColor: confirmButtonColor
});

const inputDateIsInvalid = Swal.mixin({
    title: "Неверный формат даты!",
    confirmButtonColor: confirmButtonColor,
    icon: "warning",
});

const textareaIsInvalid = Swal.mixin({
    title: "Достигнут предел количества символов!",
    confirmButtonColor: confirmButtonColor,
    icon: "warning",
});

const deleteWarning = Swal.mixin({
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: "Удалить",
    confirmButtonColor: "#ff0055",
    cancelButtonText: "Отмена",
    cancelButtonColor: confirmButtonColor,
    reverseButtons: true,
    focusConfirm: false,
    focusCancel: true
});

const selectWarning = Swal.mixin({
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: "Принять",
    confirmButtonColor: "#ff0055",
    cancelButtonText: "Отмена",
    cancelButtonColor: confirmButtonColor,
    reverseButtons: true,
    focusConfirm: false,
    focusCancel: true
});

const editAccessInfo = Swal.mixin({
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: "Да!",
    confirmButtonColor: "#ff0055",
    cancelButtonText: "Отмена",
    cancelButtonColor: confirmButtonColor,
    reverseButtons: true,
    focusConfirm: false,
    focusCancel: true
});
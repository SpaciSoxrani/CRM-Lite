class DataTableFields {
    isLockEdit = false;
    isEditRequiredField = false;
    requiredFields = new Map();
    currentOpenEditField;
    relatedFields = new Map();
    childrenFields = [];
    getDto;
    tableData;
    rowValues;
    listFields;
    urlPut;

    constructor(listFields, getDto, tableData, urlPut) {
        this.listFields = listFields;
        this.getDto = getDto;
        this.tableData = tableData;
        this.urlPut = urlPut;
    }

    addField(fieldName, fieldObject) {
        fieldObject.dataTable = this;
        this.listFields.set(fieldName, fieldObject);
    }

    editField(row, element, fieldName) {
        var fieldObject = this.listFields.get(fieldName);

        if (fieldObject && !fieldObject.isNotEditable && !this.checkIsLockEdit()) {
            this.rowValues = row;
            var newElement = fieldObject.showEditField(element);
            this.currentOpenEditField = { element: newElement[0], fieldName: fieldName, rowValues: row };
            this.isLockEdit = true;
        }
    }

    saveField(element, fieldName, newOpenFieldName) {
        var requiredFieldNames = this.requiredFields.get(fieldName);

        //todo(kuznetsov): исправить все это срочно
        if (requiredFieldNames) {
            if (!this.isEditRequiredField) {
                if (!newOpenFieldName) {
                    this.childrenFields = [];
                    for (var requiredFieldName of requiredFieldNames) {
                        var newElement = this.listFields.get(requiredFieldName)
                            .showEditField($(window.table.cell("#" + this.rowValues.id, requiredFieldName + ':name').node())
                                .children());

                        this.childrenFields.push({ element: newElement[0], fieldName: requiredFieldName });
                    }
                    this.isEditRequiredField = true;
                }
            }
            else {
                if (newOpenFieldName)
                    formIsInvalid.fire();
                return;
            }
        }

        if (this.childrenFields.find(f => f.fieldName === fieldName)) {
            while (this.childrenFields.length > 0) {
                var childrenField = this.childrenFields.pop();
                var applyResult = this.listFields.get(childrenField.fieldName).applyChanges(childrenField.element);
                if (applyResult === 'IS_EMPTY' || applyResult === 'IS_INPUT_INVALID') {
                    this.childrenFields.push(childrenField);
                    return;
                }
            }
            this.listFields.get(this.currentOpenEditField.fieldName).applyChanges(this.currentOpenEditField.element);
            this.isEditRequiredField = false;
            this.childrenFields = [];
        }

        else if (this.isEditRequiredField || !this.listFields.has(fieldName) || this.listFields.get(fieldName).applyChanges(element) != 'SUCCESS')
            return

        this.putRowValues(fieldName);
    }

    putRowValues(fieldName) {
        this.editRelatedField(fieldName);
        var rowValuesDto = this.getDto(this.rowValues);

        this.currentOpenEditField = null;
        var dataTable = this;

        $.ajax({
            type: 'PUT',
            url: this.urlPut + rowValuesDto.id,
            data: JSON.stringify(rowValuesDto),
            contentType: "application/json",
            success: function (data) {
                console.log(data);
                dataTable.tableData = dataTable.tableData.filter(value => value.id != rowValuesDto.id);

                dataTable.rowValues.changedDate = data.changedDate;

                dataTable.tableData.push(dataTable.rowValues);
                window.contactData = tableEditFields.tableData;
                filterItems();

                requestSuccessfulTimer.fire()
                    .then(() => {
                        dataTable.isLockEdit = false;
                    });
            },
            error: function (data) {
                console.log(data);
                showErrorWindow(data.status)
                return;
            },
            dataType: 'JSON'
        });
    }

    editRelatedField(fieldName, newRowValues) {
        let editfunc = this.relatedFields.get(fieldName);
        if (editfunc)
            editfunc(newRowValues ? newRowValues : this.rowValues);
    }

    fillField(element, field, name, url) {
        var dataTable = this;
        $.ajax({
            url: url,
            success: function (data) {
                if (!name) name = 'name';

                $.each(data,
                    function (idx, a) {
                        element.append(new Option(a[name], a.id));
                    });
                element.selectpicker('refresh');
                if (dataTable.rowValues) {
                    element.val(dataTable.rowValues[field + 'Id']);
                    element.selectpicker('refresh');
                }
            },
            error: function (data) {
                alert(data);
            },
            dataType: 'JSON'
        });
    }

    checkIsLockEdit() {
        var result = this.isLockEdit;

        if (result && this.currentOpenEditField)
            this.saveField(this.currentOpenEditField.element, this.currentOpenEditField.fieldName, 'EMPTY');

        return result;
    }
}

class Field {
    renderOptions;
    renderClasses;
    isRequired;
    isSorting;
    isNotEditable;
    sortMethod;
    dataTable;

    constructor(name, type, dataTable) {
        this.name = name;
        this.type = type;
        this.dataTable = dataTable;
    }

    getDataTableRender(value, row, type) {
        return this.isSorting && type === 'sort'
            ? checkIsEmptiness(value) ? '999' : this.sortMethod(value, row)
            : this.showField(value, row.id);
    }

    showField(value, rowId) {
        let renderValue = checkIsEmptiness(value) ? '<i>Пусто</i>' : value;
        let classes = checkIsEmptiness(this.renderClasses) ? '' : this.renderClasses.join(' ');
        let options = checkIsEmptiness(this.renderOptions) ? '' : this.renderOptions.join(' ');
        var newElement = '<div ' + options + ' class="' + classes + '">' + renderValue + '</div>';

        return newElement;
    }

    showEditField() {
    }

    applyChanges() {
    }

    getType() {

        return this.type;
    }
}

class TextareaField extends Field {
    maxSymbols;
    isHref;
    isCanScroll;

    constructor(name, maxSymbols, dataTable) {
        super(name, 'TEXTAREA', dataTable);
        this.maxSymbols = maxSymbols;
        this.renderClasses = ['table-textarea-field'];
    }

    showField(value, rowId) {
        if (!this.isHref)
            return super.showField(value, rowId);

        let renderValue = checkIsEmptiness(value)
            ? '<i>Пусто</i>'
            : '<a href="' + this.getHttp(value) + '">' + value + '</a>';
        let classes = checkIsEmptiness(this.renderClasses) ? '' : this.renderClasses.join(' ');
        let options = checkIsEmptiness(this.renderOptions) ? '' : this.renderOptions.join(' ');
        return '<div ' + options + ' class="' + classes + '" >' + renderValue + '</div>';
    }

    showEditField(element) {
        var htmlValue = $(element).html();
        var textValue = $(element).text();
        var newElement;
        if (this.isCanScroll)
            $(element)[0].className = "";
 
        if (htmlValue === '<i>Пусто</i>')
            textValue = '';
        $(element).html('<textarea type="text" class="form-control text-input">');
        newElement = $(element).children()
        var fieldName = this.name;
        var dataTable = this.dataTable;
        newElement.on("keypress", function (event) {
            this.style.height = "auto";
            this.style.height = (this.scrollHeight) + "px";
            if (event.key === "Enter" && !event.shiftKey) {
                dataTable.saveField(this, fieldName)

                return false;
            }

            return true;
        });
        newElement.val(textValue).focus();

        return newElement;
    }

    applyChanges(element) {
        let editValue = $(element).val();
        let parentElement = $(element).parent();

        if (this.isRequired && checkIsEmptiness(editValue)) {
            if (!element.classList.contains('is-invalid'))
                element.classList.add('is-invalid');
            formIsInvalid.fire();

            return 'IS_EMPTY';
        }

        if (this.dataTable.rowValues[this.name] === editValue) {
            parentElement.html(checkIsEmptiness(editValue)
                ? '<i>Пусто</i>'
                : this.isHref ? ('<a href="' + this.getHttp(editValue) + '">' + editValue + '</a>')
                    : editValue);
            if (this.isCanScroll) {
                parentElement[0].className = checkIsEmptiness(this.renderClasses) ? '' : this.renderClasses.join(' ');
            }
            this.dataTable.isLockEdit = false;

            return 'IS_NO_CHANGED';
        }

        if (editValue.length < this.maxSymbols) {
            parentElement.html(editValue);
            this.dataTable.rowValues[this.name] = editValue;
        }
        else {
            if (!element.classList.contains('is-invalid'))
                element.classList.add('is-invalid');
            textareaIsInvalid.fire({
                text: "Вы ввели " + $(element).val().length + " символов из максимальных " + this.maxSymbols
            });

            return 'IS_INPUT_INVALID';
        }
        if (this.isCanScroll)
            parentElement[0].className = checkIsEmptiness(this.renderClasses) ? '' : this.renderClasses.join(' ');

        return 'SUCCESS';
    }

    getHttp(link) {
        if (/^http(s?):\/\//.test(link))
            return link;
        else
            return 'http://' + link;
    }
}

class SelectField extends Field {
    selectFieldId;
    confirmText = 'Вы действительно хотите выбрать {fieldText}?';
    isConfirm;
    fillFieldUrl;
    fillFieldName;
    isNullable;

    constructor(name, dataTable) {
        super(name, 'SELECT', dataTable);
        this.renderClasses = ['table-select-field'];
    }

    showEditField(element) {
        var newElement;
        $(element).html('<select class="selectpicker form-control list-input" id="' + this.selectFieldId + '"'
            + 'data-style="btn-gray" data-size="5" data-live-search="true" data-container="body"'
            + (this.isNullable ? 'data-none-selected-text="Не выбрано">' : '><option value="" >Не выбрано</option>')
            + '</select>');
        newElement = $(element).children()
        newElement.focus();
        var fieldName = this.name;
        var dataTable = this.dataTable;
        newElement.on('changed.bs.select', function (event, clickedIndex, isSelected, previousValue) {
            if (isSelected) {
                dataTable.saveField(this, fieldName);
            }
        });

        this.dataTable.fillField(newElement, this.name, this.fillFieldName, this.fillFieldUrl);

        return newElement;
    }

    applyChanges(element) {
        let editValue = $(element).val();

        if (this.isRequired && checkIsEmptiness(editValue)) {
            if (!element[0].classList.contains('is-invalid')) {
                element[0].classList.add('is-invalid');
                element.selectpicker('refresh');
            }
            formIsInvalid.fire();
            return 'IS_EMPTY';
        }

        if (this.dataTable.rowValues[this.name + 'Id'] === editValue
            || checkIsEmptiness(this.dataTable.rowValues[this.name + 'Id']) && checkIsEmptiness(editValue)) {
            $(element).parent().parent().html(checkIsEmptiness(editValue) ? '<i>Пусто</i>' : this.dataTable.rowValues[this.name]);
            $('.list-input.show').remove();
            this.dataTable.isLockEdit = false;

            return 'IS_NO_CHANGED';
        }

        if (this.isConfirm) {
            var fieldText = $('#' + this.selectFieldId + " option:selected").text();
            selectWarning.fire({
                title: "Подтвердите выбор",
                text: this.confirmText.replace('{fieldText}', fieldText)
            }).then((result) => {
                if (result.isConfirmed) {
                    this.dataTable.rowValues[this.name + 'Id'] = editValue;
                    this.dataTable.rowValues[this.name] = $('#' + this.selectFieldId + " option:selected").text();
                    $(element).parent().parent().html(this.dataTable.rowValues[this.name]);
                    $('.list-input.show').remove();

                    this.dataTable.putRowValues(this.name);
                }
                else {
                    $(element).parent().parent().html(checkIsEmptiness(this.dataTable.rowValues[this.name])
                        ? '<i>Пусто</i>'
                        : this.dataTable.rowValues[this.name]);
                    $('.list-input.show').remove();
                    this.dataTable.isLockEdit = false;
                }
            });

            return 'IS_CONFIRM_WINDOW';
        }

        this.dataTable.rowValues[this.name + 'Id'] = editValue;
        let selectedText = $('#' + this.selectFieldId + " option:selected").text();
        this.dataTable.rowValues[this.name] = selectedText === 'Не выбрано' ? '' : selectedText;
        $(element).parent().parent().html(checkIsEmptiness(this.dataTable.rowValues[this.name])
            ? '<i>Пусто</i>'
            : this.dataTable.rowValues[this.name]);
        $('.list-input.show').remove();

        return 'SUCCESS';
    }
}

class InputDateField extends Field {
    constructor(name, dataTable) {
        super(name, 'INPUT_DATE', dataTable);
        this.renderClasses = ['table-textarea-field'];
    }

    showField(value, rowId) {
        let dateValue = new Date(value);

        let renderValue = checkIsEmptiness(value) ? '<i>Пусто</i>' : moment(dateValue).format('DD.MM.YYYY');
        let classes = checkIsEmptiness(this.renderClasses) ? '' : this.renderClasses.join(' ');
        let options = checkIsEmptiness(this.renderOptions) ? '' : this.renderOptions.join(' ');
        return '<div ' + options + ' class="' + classes + '" >'
            + renderValue
            + '</div>';
    }

    showEditField(element, rowId) {
        var newElement;
        var startValue = $(element).html();
        if (startValue === '<i>Пусто</i>')
            startValue = '';
        $(element).html('<input type="text" class="form-control date-input" placeholder = "дд.мм.гггг" />');
        newElement = $(element).children()
        var fieldName = this.name;
        var dataTable = this.dataTable;
        newElement.on("keypress", function (event) {
            if (event.key === "Enter") {
                dataTable.saveField(this, fieldName)
                return false;
            }

            let symbolNum = newElement.val().length;

            if (symbolNum === 2 || symbolNum === 5) {
                newElement.val(newElement.val() + '.');
            }

            return (event.key >= '0' && event.key <= '9' && newElement.val().length < 10) || event.key === "Backspace";
        });
        newElement.val(startValue).focus();

        return newElement;
    }

    applyChanges(element) {
        let editValue = $(element).val();
        let editValueParse = editValue.split('.')
        let dateValue = new Date(editValueParse[2],);
        dateValue.setFullYear(editValueParse[2], editValueParse[1] - 1, editValueParse[0]);
        dateValue.setHours(12);

        if (this.isRequired && checkIsEmptiness(editValue)) {
            if (!element.classList.contains('is-invalid'))
                element.classList.add('is-invalid');
            formIsInvalid.fire();

            return 'IS_EMPTY';
        }

        if (moment(this.dataTable.rowValues[this.name]).format('DD.MM.YYYY') === editValue) {
            $(element).parent().html(checkIsEmptiness(editValue) ? '<i>Пусто</i>' : editValue);
            isLockEdit = false;

            return 'IS_NO_CHANGED';
        }

        if ($(element).val().length != 10) {
            if (!element.classList.contains('is-invalid'))
                element.classList.add('is-invalid');
            inputDateIsInvalid.fire({
                text: "Вы ввели " + $(element).val() + ", а надо в формате ДД.ММ.ГГГГ"
            });

            return 'IS_INPUT_INVALID';
        }
        $(element).parent().html(editValue);
        this.dataTable.rowValues[this.name] = dateValue;

        return 'SUCCESS';
    }
}

function checkIsEmptiness(value) {
    return !value || value.length === 0;
}
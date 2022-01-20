function LoadTemplate(id) {
    window.fetch(`${api}/api/EmailTemplates/${id}`,
            {
                credentials: 'include',
                method: 'GET'
            })
        .then((res) => res.json())
        .then((template) => {
            console.info(template);
            $("#drop-zone").html(template.htmlTemplate);
            $('#template-name').val(template.name);
            window.mjmlManager.elementIdCounter = template.counter;
            InsertMjmlElements(template.elements);
        })
        .catch((err) => {
            console.error(err);
        });
}

function InsertMjmlElements(elements) {
    for (let el of elements) {
        let elementName = el.name.replace(/[0-9]/g, '');
        let mjmlFunc = GetReservedMjmlFunction(elementName);

        if (mjmlFunc) {
            window.mjmlManager.mjmlElementsMap.set(el.name,
                {
                    insideMjmlIds: JSON.parse(el.insideMjmlIds),
                    props: JSON.parse(el.propsJson),
                    returnedMjml: mjmlFunc
                });

            ConfigureEditor(el.name);
        }

    }
}

function ConfigureEditor(elementName) {
    if (elementName.includes("parent-column")) 
        window.InitPopOverForColumn(elementName);
    if (elementName.includes('text'))
        window.configureEditorForText(elementName);
    if (elementName.includes('button'))
        window.configureEditorForButton(elementName);
}

function GetReservedMjmlFunction(elementName) {
    if (window.mjmlDragDropInsertElements.has(elementName))
        return window.mjmlDragDropInsertElements.get(elementName).mjmlObj.returnedMjml;

    if (window.mjmlDragDropElements.has(elementName))
        return window.mjmlDragDropElements.get(elementName).mjmlObj.returnedMjml;

    if (window.mjmlManager.reservedMjmlMap.has(elementName))
        return window.mjmlManager.reservedMjmlMap.get(elementName).returnedMjml;
}
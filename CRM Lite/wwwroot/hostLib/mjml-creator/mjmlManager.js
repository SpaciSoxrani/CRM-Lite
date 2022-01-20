class MjmlManager {
    constructor() {
        this.elementIdCounter = 1;
        this.reservedMjmlMap = new Map([
            ["reserved-column-with-picture", {
                props: {
                    "padding-top": "10px",
                    "padding-bottom": "10px",
                    "padding-left": "10px",
                    "padding-right": "10px"
                },
                returnedMjml: function (children, props) {
                    return `<mj-column ${props}>
                        ${children}
                    </mj-column>`;
                },
                insideMjmlIds: [],
                htmlElement: (id) => `<div class="mx-auto border-dotted text-center col mj-column" style="padding-left: 10px;padding-top: 10px;padding-right: 10px;padding-bottom: 10px;" id="${id}">
                                <div class="m-5 element-label">
                                    <svg viewBox="0 0 40 40"><g><path d="M23.713 23.475h5.907c.21 0 .38.17.38.38v.073c0 .21-.17.38-.38.38h-5.907a.38.38 0 0 1-.38-.38v-.073c0-.21.17-.38.38-.38zm.037-2.917h9.167a.417.417 0 0 1 0 .834H23.75a.417.417 0 0 1 0-.834zm0-2.5h9.167a.417.417 0 0 1 0 .834H23.75a.417.417 0 0 1 0-.834zm-.037-3.333h5.907c.21 0 .38.17.38.38v.073c0 .21-.17.38-.38.38h-5.907a.38.38 0 0 1-.38-.38v-.073c0-.21.17-.38.38-.38zm.037-2.917h9.167a.417.417 0 0 1 0 .834H23.75a.417.417 0 0 1 0-.834zm0-2.916h9.167a.417.417 0 0 1 0 .833H23.75a.417.417 0 0 1 0-.833zm-3.592 8.75a.675.675 0 0 1 .675.691v6.142c0 .374-.3.679-.675.683h-6.15a.683.683 0 0 1-.675-.683v-6.142a.675.675 0 0 1 .675-.691h6.15zM20 24.308v-5.833h-5.833v5.833H20zm.158-15.833a.675.675 0 0 1 .675.692v6.141c0 .374-.3.68-.675.684h-6.15a.683.683 0 0 1-.675-.684V9.167a.675.675 0 0 1 .675-.692h6.15zM20 15.142V9.308h-5.833v5.834H20zM37.167 0A2.809 2.809 0 0 1 40 2.833V30.5a2.809 2.809 0 0 1-2.833 2.833h-3.834v3H32.5v-3h-23A2.808 2.808 0 0 1 6.667 30.5v-23H3.583v-.833h3.084V2.833A2.808 2.808 0 0 1 9.5 0h27.667zm2 30.5V2.833a2.025 2.025 0 0 0-2-2H9.5a2.025 2.025 0 0 0-2 2V30.5a2.025 2.025 0 0 0 2 2h27.667a2.025 2.025 0 0 0 2-2zM0 27.75h.833V31H0v-3.25zm0-13h.833V18H0v-3.25zm0 22.833V34.25h.833v3.25L0 37.583zM0 21.25h.833v3.25H0v-3.25zM2.583 40l.084-.833h3.166V40h-3.25zm27.917-.833c.376.006.748-.08 1.083-.25l.417.666a2.875 2.875 0 0 1-1.5.417h-1.833v-.833H30.5zm-8.333 0h3.25V40h-3.25v-.833zm-6.584 0h3.25V40h-3.25v-.833zm-6.5 0h3.25V40h-3.25v-.833zM0 9.5c.01-.5.154-.99.417-1.417l.666.417c-.17.305-.256.65-.25 1v2H0v-2z"></path></g></svg>
                                    <p>Перетащите сюда элемент</p>
                                </div>
                            </div>`
            }],
            [
                "reserved-column-without-picture", {
                    props: {
                        "padding-top": "10px",
                        "padding-bottom": "10px",
                        "padding-left": "10px",
                        "padding-right": "10px"
                    },
                    returnedMjml: function (children, props) {
                        return `<mj-column ${props}>
                        ${children}
                    </mj-column>`;
                    },
                    insideMjmlIds: [],
                    htmlElement: (id) => `<div class="mx-auto border-dotted text-center col mj-column" style="padding-left: 10px;padding-top: 10px;padding-right: 10px;padding-bottom: 10px;" id="${id}">
                                <div class="m-5 element-label">Перетащите сюда элемент</div>
                            </div>`
                }
            ]
        ]);
        this.mjmlElementsMap = new Map();
    }

    mjmlObjPropsTraslator(props) {
        let propsStr = "";
        for (let key in props) {
            propsStr += key + "= \"" + props[key] + "\" ";
        }

        return propsStr;
    }

    mjmlObjChildrenTraslator(insideMjmlIds) {

        let mjmlStr = "";
        for (var childId of insideMjmlIds) {
            let mjmlObj;

            if (!this.mjmlElementsMap.has(childId)) {
                if (!this.reservedMjmlMap.has(childId))
                    mjmlStr += childId.trim();
                else 
                    mjmlObj = this.reservedMjmlMap.get(childId);
            } else {
                mjmlObj = this.mjmlElementsMap.get(childId);
            }

            if (mjmlObj)
                mjmlStr += this.mjmlObjTranslator(mjmlObj);
        }

        return mjmlStr;
    }

    mjmlObjTranslator(mjmlObj) {
        let children = "";
        let props = this.mjmlObjPropsTraslator(mjmlObj.props);

        if (mjmlObj.insideMjmlIds && mjmlObj.insideMjmlIds.length)
            children = this.mjmlObjChildrenTraslator(mjmlObj.insideMjmlIds);

        let mjml = mjmlObj.returnedMjml(children, props);
        return mjml;
    }

    getInsideMjmlObjects(actualId) {
        let mjmlManager = this;
        let mjmlObjs = mjmlManager.mjmlElementsMap.get(actualId).insideMjmlIds.map((id) => [id, mjmlManager.mjmlElementsMap.get(id)]);

        return new Map(mjmlObjs);
    }

    deploy() {
        let mjmlManager = this;
        let finalMjml = "";
        for (var el of mjmlManager.mjmlElementsMap.entries()) {
            if (el[0].includes("parent"))
                finalMjml += mjmlManager.mjmlObjTranslator(el[1]);
        }

        return finalMjml;
    }

    changeTextValue(elementId, text) {
        if (!elementId.includes("text") && !elementId.includes("button"))
            console.error("Ошибка ввода в текстовое поле");

        let oldMjmlObj = this.mjmlElementsMap.get(elementId);
        let newElement = _.cloneDeep(oldMjmlObj);

        if (newElement.insideMjmlIds) 
            newElement.insideMjmlIds[0] = text.replace("contenteditable=\"true\"", "");
        
        this.mjmlElementsMap.set(elementId, newElement);
    }

    changePropValue(elementId, propName, propValue) {
        let oldMjmlObj = this.mjmlElementsMap.get(elementId);
        let newElement = _.cloneDeep(oldMjmlObj);

        newElement.props[propName] = propValue;

        this.mjmlElementsMap.set(elementId, newElement);
    }

    getPropValue(elementId, propName) {
        let mjmlObj = this.mjmlElementsMap.get(elementId);

        if (mjmlObj.props.hasOwnProperty(propName))
            return mjmlObj.props[propName];

        return undefined;
    }

    deleteMjmlElement(elementId, needToDeleteElement = false) {
        this.mjmlElementsMap.delete(elementId);
        for (var el of this.mjmlElementsMap.entries()) {
            el[1].insideMjmlIds = el[1].insideMjmlIds.filter((item, index, arr) => item !== elementId);
            if (el[0].includes("parent") && !el[1].insideMjmlIds.length) {
                this.deleteMjmlElement(el[0], true);
                if (!$('#drop-zone').children().length) {
                    $('#drop-zone').append(
                        `<div class="w-50 m-auto text-center row border-dotted" id="first-container-label">
                            <div class="m-auto text-center p-5 col">
                                Перетащите сюда свой первый контейнер
                            </div>
                        </div>`);
                }
            }
        }
        if (needToDeleteElement)
            $(`#${elementId}`).remove();
    }

    addMjmlElementToMap(newElement, parentId = null) {
        let mjmlManager = this;
        let element = _.cloneDeep(newElement);
        if (element.mjmlObj.insideMjmlIds && element.mjmlObj.insideMjmlIds.length) {
            let newInsideMjmlIds = [];
            let mjmlObj;
            element.mjmlObj.insideMjmlIds.forEach(function (childId, i, arr) {
                if (!mjmlManager.mjmlElementsMap.has(childId)) {
                    if (!mjmlManager.reservedMjmlMap.has(childId))
                        newInsideMjmlIds.push(childId);
                    else
                        mjmlObj = mjmlManager.reservedMjmlMap.get(childId);
                } else {
                    mjmlObj = mjmlManager.mjmlElementsMap.get(childId);
                }

                if (mjmlObj)
                    newInsideMjmlIds.push(mjmlManager.addReservedMjmlElementToMap(mjmlObj, childId));
            });

            element.mjmlObj.insideMjmlIds = newInsideMjmlIds;
        }

        let dataId = element.id + mjmlManager.elementIdCounter++;

        if (parentId) {
            let parentElement = _.cloneDeep(this.mjmlElementsMap.get(parentId));
            parentElement.insideMjmlIds.push(dataId);
            this.mjmlElementsMap.set(parentId, parentElement);
        }

        this.mjmlElementsMap.set(dataId, element.mjmlObj);

        return dataId;
    }

    addReservedMjmlElementToMap(mjmlObj, id) {
        let mjmlManager = this;
        if (mjmlObj.insideMjmlIds && mjmlObj.insideMjmlIds.length) {
            let newInsideMjmlIds = [];
            let additionalMjmlObj;
            mjmlObj.insideMjmlIds.forEach(function (childId, i, arr) {
                if (!mjmlManager.mjmlElementsMap.has(childId)) {
                    if (!mjmlManager.reservedMjmlMap.has(childId))
                        newInsideMjmlIds.push(childId);
                    else
                        additionalMjmlObj = mjmlManager.reservedMjmlMap.get(childId);
                } else {
                    additionalMjmlObj = mjmlManager.mjmlElementsMap.get(childId);
                }

                if (additionalMjmlObj)
                    newInsideMjmlIds.push(mjmlManager.addReservedMjmlElementToMap(additionalMjmlObj, childId));
            });

            mjmlObj.insideMjmlIds = newInsideMjmlIds;
        }

        let dataId = id + mjmlManager.elementIdCounter++;
        this.mjmlElementsMap.set(dataId, mjmlObj);

        return dataId;
    }
}
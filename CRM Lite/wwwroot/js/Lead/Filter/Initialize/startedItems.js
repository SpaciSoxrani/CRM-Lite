function initializeStartedItems(items) {

    for (var [key, filterFunction] of filterFunctions) {
        items = items.filter(item => filterFunction(item));
    }

    return items;
}
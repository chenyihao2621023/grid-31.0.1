var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Component, PostConstruct, RefSelector, TooltipFeature, VirtualList, _ } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { AdvancedFilterBuilderItemComp } from "./advancedFilterBuilderItemComp";
import { AdvancedFilterBuilderDragFeature } from "./advancedFilterBuilderDragFeature";
import { AdvancedFilterBuilderItemAddComp } from "./advancedFilterBuilderItemAddComp";
import { AdvancedFilterBuilderEvents } from "./iAdvancedFilterBuilder";
export class AdvancedFilterBuilderComp extends Component {
    constructor() {
        super(/* html */ `
            <div role="presentation" class="ag-advanced-filter-builder" tabindex="-1">
                <div role="presentation" class="ag-advanced-filter-builder-list" ref="eList"></div>
                <div role="presentation" class="ag-advanced-filter-builder-button-panel">
                    <button class="ag-button ag-standard-button ag-advanced-filter-builder-apply-button" ref="eApplyFilterButton"></button>
                    <button class="ag-button ag-standard-button ag-advanced-filter-builder-cancel-button" ref="eCancelFilterButton"></button>
                </div>
            </div>`);
        this.validationMessage = null;
    }
    postConstruct() {
        var _a;
        const { showMoveButtons } = (_a = this.gridOptionsService.get('advancedFilterBuilderParams')) !== null && _a !== void 0 ? _a : {};
        this.showMove = !!showMoveButtons;
        this.addManagedPropertyListener('advancedFilterBuilderParams', ({ currentValue }) => {
            this.showMove = !!(currentValue === null || currentValue === void 0 ? void 0 : currentValue.showMoveButtons);
            this.refreshList(false);
        });
        this.filterModel = this.setupFilterModel();
        this.setupVirtualList();
        this.dragFeature = this.createManagedBean(new AdvancedFilterBuilderDragFeature(this, this.virtualList));
        this.setupButtons();
    }
    refresh() {
        let indexToFocus = this.virtualList.getLastFocusedRow();
        this.setupFilterModel();
        this.validateItems();
        this.refreshList(false);
        if (indexToFocus != null) {
            // last focused row is cleared on focus out, so if defined, we need to put the focus back
            if (!this.virtualList.getComponentAt(indexToFocus)) {
                indexToFocus = 0;
            }
            this.virtualList.focusRow(indexToFocus);
        }
    }
    getNumItems() {
        return this.items.length;
    }
    moveItem(item, destination) {
        if (!destination || !item) {
            return;
        }
        this.moveItemToIndex(item, destination.rowIndex, destination.position);
    }
    afterGuiAttached() {
        this.virtualList.focusRow(0);
    }
    setupVirtualList() {
        this.virtualList = this.createManagedBean(new VirtualList({
            cssIdentifier: 'advanced-filter-builder',
            ariaRole: 'tree',
            listName: this.advancedFilterExpressionService.translate('ariaAdvancedFilterBuilderList')
        }));
        this.virtualList.setComponentCreator(this.createItemComponent.bind(this));
        this.virtualList.setComponentUpdater(this.updateItemComponent.bind(this));
        this.virtualList.setRowHeight(40);
        this.eList.appendChild(this.virtualList.getGui());
        this.virtualList.setModel({
            getRowCount: () => this.items.length,
            getRow: (index) => this.items[index],
            areRowsEqual: (oldRow, newRow) => oldRow === newRow
        });
        this.buildList();
        this.virtualList.refresh();
    }
    setupButtons() {
        this.eApplyFilterButton.innerText = this.advancedFilterExpressionService.translate('advancedFilterBuilderApply');
        this.activateTabIndex([this.eApplyFilterButton]);
        this.addManagedListener(this.eApplyFilterButton, 'click', () => {
            this.advancedFilterService.setModel(this.filterModel);
            this.filterManager.onFilterChanged({ source: 'advancedFilter' });
            this.close();
        });
        this.validationTooltipFeature = this.createManagedBean(new TooltipFeature({
            getGui: () => this.eApplyFilterButton,
            getLocation: () => 'advancedFilter',
            getTooltipValue: () => this.validationMessage,
            getTooltipShowDelayOverride: () => 1000
        }, this.beans));
        this.validationTooltipFeature.setComp(this.eApplyFilterButton);
        this.validate();
        this.addManagedListener(this.eApplyFilterButton, 'mouseenter', () => this.addOrRemoveCssClass('ag-advanced-filter-builder-validation', true));
        this.addManagedListener(this.eApplyFilterButton, 'mouseleave', () => this.addOrRemoveCssClass('ag-advanced-filter-builder-validation', false));
        this.eCancelFilterButton.innerText = this.advancedFilterExpressionService.translate('advancedFilterBuilderCancel');
        this.activateTabIndex([this.eCancelFilterButton]);
        this.addManagedListener(this.eCancelFilterButton, 'click', () => this.close());
    }
    removeItemFromParent(item) {
        const sourceParentIndex = item.parent.conditions.indexOf(item.filterModel);
        item.parent.conditions.splice(sourceParentIndex, 1);
        return sourceParentIndex;
    }
    moveItemToIndex(item, destinationRowIndex, destinationPosition) {
        var _a;
        const destinationItem = this.items[destinationRowIndex];
        const destinationIsParent = ((_a = destinationItem.filterModel) === null || _a === void 0 ? void 0 : _a.filterType) === 'join' && destinationPosition === 'bottom';
        const destinationParent = destinationIsParent ? destinationItem.filterModel : destinationItem.parent;
        // trying to move before the root
        if (!destinationParent) {
            return;
        }
        // can't move into itself
        if (this.isChildOrSelf(destinationParent, item.filterModel) || destinationItem === item) {
            return;
        }
        this.removeItemFromParent(item);
        let destinationParentIndex;
        if (destinationIsParent) {
            destinationParentIndex = 0;
        }
        else {
            destinationParentIndex = destinationParent.conditions.indexOf(destinationItem.filterModel);
            if (destinationParentIndex === -1) {
                destinationParentIndex = destinationParent.conditions.length;
            }
            else if (destinationPosition === 'bottom') {
                destinationParentIndex += 1;
            }
        }
        destinationParent.conditions.splice(destinationParentIndex, 0, item.filterModel);
        this.refreshList(false);
    }
    isChildOrSelf(modelToCheck, potentialParentModel) {
        return modelToCheck === potentialParentModel || (potentialParentModel.filterType === 'join' &&
            potentialParentModel.conditions.some(condition => this.isChildOrSelf(modelToCheck, condition)));
    }
    setupFilterModel() {
        const filterModel = this.formatFilterModel(this.advancedFilterService.getModel());
        this.stringifiedModel = JSON.stringify(filterModel);
        return filterModel;
    }
    formatFilterModel(filterModel) {
        filterModel = filterModel !== null && filterModel !== void 0 ? filterModel : {
            filterType: 'join',
            type: 'AND',
            conditions: []
        };
        if (filterModel.filterType !== 'join') {
            filterModel = {
                filterType: 'join',
                type: 'AND',
                conditions: [filterModel]
            };
        }
        return filterModel;
    }
    buildList() {
        const parseFilterModel = (filterModel, items, level, parent) => {
            items.push({ filterModel, level, parent, valid: true, showMove: this.showMove });
            if (filterModel.filterType === 'join') {
                filterModel.conditions.forEach(childFilterModel => parseFilterModel(childFilterModel, items, level + 1, filterModel));
                if (level === 0) {
                    items.push({ filterModel: null, level: level + 1, parent: filterModel, valid: true });
                }
            }
        };
        this.items = [];
        parseFilterModel(this.filterModel, this.items, 0);
    }
    refreshList(softRefresh) {
        if (!softRefresh) {
            const invalidModels = [];
            this.items.forEach(item => {
                if (!item.valid) {
                    invalidModels.push(item.filterModel);
                }
            });
            this.buildList();
            if (invalidModels.length) {
                this.items.forEach(item => {
                    if (item.filterModel && invalidModels.includes(item.filterModel)) {
                        item.valid = false;
                    }
                });
            }
        }
        this.virtualList.refresh(softRefresh);
        this.validate();
    }
    updateItemComponent(item, comp) {
        const index = this.items.indexOf(item);
        const populateTreeLines = (filterModel, treeLines) => {
            const parentItem = this.items.find(itemToCheck => itemToCheck.filterModel === filterModel);
            const parentFilterModel = parentItem === null || parentItem === void 0 ? void 0 : parentItem.parent;
            if (parentFilterModel) {
                const { conditions } = parentFilterModel;
                // check parent
                populateTreeLines(parentFilterModel, treeLines);
                treeLines.push(conditions[conditions.length - 1] === filterModel);
            }
        };
        const treeLines = [];
        const { filterModel } = item;
        if (filterModel) {
            populateTreeLines(filterModel, treeLines);
            // the add item button is always last child
            treeLines[0] = false;
        }
        const showStartTreeLine = (filterModel === null || filterModel === void 0 ? void 0 : filterModel.filterType) === 'join' && !!filterModel.conditions.length;
        comp.setState({
            disableMoveUp: index === 1,
            disableMoveDown: !this.canMoveDown(item, index),
            treeLines,
            showStartTreeLine
        });
    }
    createItemComponent(item, focusWrapper) {
        const itemComp = this.createBean(item.filterModel
            ? new AdvancedFilterBuilderItemComp(item, this.dragFeature, focusWrapper)
            : new AdvancedFilterBuilderItemAddComp(item, focusWrapper));
        itemComp.addManagedListener(itemComp, AdvancedFilterBuilderEvents.EVENT_REMOVED, ({ item }) => this.removeItem(item));
        itemComp.addManagedListener(itemComp, AdvancedFilterBuilderEvents.EVENT_VALUE_CHANGED, () => this.validate());
        itemComp.addManagedListener(itemComp, AdvancedFilterBuilderEvents.EVENT_ADDED, ({ item, isJoin }) => this.addItem(item, isJoin));
        itemComp.addManagedListener(itemComp, AdvancedFilterBuilderEvents.EVENT_MOVED, ({ item, backwards }) => this.moveItemUpDown(item, backwards));
        if (itemComp instanceof AdvancedFilterBuilderItemComp) {
            this.updateItemComponent(item, itemComp);
        }
        return itemComp;
    }
    addItem(item, isJoin) {
        var _a;
        const { parent: itemParent, level, filterModel: itemFilterModel } = item;
        const itemIsJoin = (itemFilterModel === null || itemFilterModel === void 0 ? void 0 : itemFilterModel.filterType) === 'join';
        const filterModel = isJoin ? {
            filterType: 'join',
            type: 'AND',
            conditions: []
        } : {};
        const parent = (itemIsJoin ? itemFilterModel : itemParent);
        let insertIndex = itemIsJoin ? 0 : parent.conditions.indexOf(itemFilterModel);
        if (insertIndex >= 0) {
            if (!itemIsJoin) {
                insertIndex += 1;
            }
            parent.conditions.splice(insertIndex, 0, filterModel);
        }
        else {
            parent.conditions.push(filterModel);
        }
        let index = this.items.indexOf(item);
        const softRefresh = index >= 0;
        if (softRefresh) {
            if (item.filterModel) {
                index++;
            }
            const newItems = [{
                    filterModel,
                    level: itemIsJoin ? level + 1 : level,
                    parent,
                    valid: isJoin,
                    showMove: this.showMove
                }];
            this.items.splice(index, 0, ...newItems);
        }
        this.refreshList(softRefresh);
        if (softRefresh) {
            (_a = this.virtualList.getComponentAt(index)) === null || _a === void 0 ? void 0 : _a.afterAdd();
        }
    }
    removeItem(item) {
        var _a;
        const parent = item.parent;
        const { filterModel } = item;
        const parentIndex = parent.conditions.indexOf(filterModel);
        parent.conditions.splice(parentIndex, 1);
        const isJoin = ((_a = item.filterModel) === null || _a === void 0 ? void 0 : _a.filterType) === 'join';
        const index = this.items.indexOf(item);
        // if it's a join, we don't know how many children there are, so always rebuild
        const softRefresh = !isJoin && index >= 0;
        if (softRefresh) {
            this.items.splice(index, 1);
        }
        this.refreshList(softRefresh);
        if (index >= 0) {
            this.virtualList.focusRow(index);
        }
    }
    moveItemUpDown(item, backwards) {
        const itemIndex = this.items.indexOf(item);
        const destinationIndex = backwards ? itemIndex - 1 : itemIndex + 1;
        if (destinationIndex === 0 || (!backwards && !this.canMoveDown(item, itemIndex))) {
            return;
        }
        const destinationItem = this.items[destinationIndex];
        const indexInParent = this.removeItemFromParent(item);
        const { level, filterModel, parent } = item;
        const { level: destinationLevel, filterModel: destinationFilterModel, parent: destinationParent } = destinationItem;
        if (backwards) {
            if (destinationLevel === level && destinationFilterModel.filterType === 'join') {
                // destination is empty join. move to last child
                destinationFilterModel.conditions.push(filterModel);
            }
            else if (destinationLevel <= level) {
                // same parent or first child. move above destination in destination parent
                const destinationIndex = destinationParent.conditions.indexOf(destinationFilterModel);
                destinationParent.conditions.splice(destinationIndex, 0, filterModel);
            }
            else {
                // need to move up a level. move to end of previous item's children
                const newParentItem = parent.conditions[indexInParent - 1];
                newParentItem.conditions.push(filterModel);
            }
        }
        else {
            if (destinationLevel === level) {
                if (destinationFilterModel.filterType === 'join') {
                    // destination is join. move to first child
                    destinationFilterModel.conditions.splice(0, 0, filterModel);
                }
                else {
                    // switch positions
                    const destinationIndex = destinationParent.conditions.indexOf(destinationFilterModel);
                    destinationParent.conditions.splice(destinationIndex + 1, 0, filterModel);
                }
            }
            else {
                if (indexInParent < parent.conditions.length) {
                    // keep in parent, but swap with next child
                    parent.conditions.splice(indexInParent + 1, 0, filterModel);
                }
                else {
                    // need to move down a level. move after parent in its parent
                    const parentItem = this.items.find(itemToCheck => itemToCheck.filterModel === parent);
                    const destinationIndex = parentItem.parent.conditions.indexOf(parentItem.filterModel) + 1;
                    parentItem.parent.conditions.splice(destinationIndex, 0, filterModel);
                }
            }
        }
        this.refreshList(false);
        const newIndex = this.items.findIndex(({ filterModel: filterModelToCheck }) => filterModelToCheck === filterModel);
        if (newIndex >= 0) {
            const comp = this.virtualList.getComponentAt(newIndex);
            if (comp instanceof AdvancedFilterBuilderItemComp) {
                comp.focusMoveButton(backwards);
            }
        }
    }
    canMoveDown(item, index) {
        return !((item.level === 1 && index === this.items.length - 2) ||
            (item.level === 1 && item.parent.conditions[item.parent.conditions.length - 1] === item.filterModel));
    }
    close() {
        this.advancedFilterService.getCtrl().toggleFilterBuilder('ui');
    }
    validate() {
        let disableApply = !this.items.every(({ valid }) => valid);
        if (!disableApply) {
            disableApply = JSON.stringify(this.filterModel) === this.stringifiedModel;
            if (disableApply) {
                this.validationMessage = this.advancedFilterExpressionService.translate('advancedFilterBuilderValidationAlreadyApplied');
            }
            else {
                this.validationMessage = null;
            }
        }
        else {
            this.validationMessage = this.advancedFilterExpressionService.translate('advancedFilterBuilderValidationIncomplete');
        }
        _.setDisabled(this.eApplyFilterButton, disableApply);
        this.validationTooltipFeature.refreshToolTip();
    }
    validateItems() {
        const clearOperator = (filterModel) => {
            filterModel.type = undefined;
        };
        const clearOperand = (filterModel) => {
            delete filterModel.filter;
        };
        this.items.forEach(item => {
            if (!item.valid || !item.filterModel || item.filterModel.filterType === 'join') {
                return;
            }
            const { filterModel } = item;
            const { colId } = filterModel;
            const hasColumn = this.advancedFilterExpressionService.getColumnAutocompleteEntries().find(({ key }) => key === colId);
            const columnDetails = this.advancedFilterExpressionService.getColumnDetails(filterModel.colId);
            if (!hasColumn || !columnDetails.column) {
                item.valid = false;
                filterModel.colId = undefined;
                clearOperator(filterModel);
                clearOperand(filterModel);
                return;
            }
            const operatorForType = this.advancedFilterExpressionService.getDataTypeExpressionOperator(columnDetails.baseCellDataType);
            const operator = operatorForType.operators[filterModel.type];
            if (!operator) {
                item.valid = false;
                clearOperator(filterModel);
                clearOperand(filterModel);
                return;
            }
            if (operator.numOperands > 0 && !_.exists(filterModel.filter)) {
                item.valid = false;
                return;
            }
        });
    }
}
__decorate([
    RefSelector('eList')
], AdvancedFilterBuilderComp.prototype, "eList", void 0);
__decorate([
    RefSelector('eApplyFilterButton')
], AdvancedFilterBuilderComp.prototype, "eApplyFilterButton", void 0);
__decorate([
    RefSelector('eCancelFilterButton')
], AdvancedFilterBuilderComp.prototype, "eCancelFilterButton", void 0);
__decorate([
    Autowired('filterManager')
], AdvancedFilterBuilderComp.prototype, "filterManager", void 0);
__decorate([
    Autowired('advancedFilterService')
], AdvancedFilterBuilderComp.prototype, "advancedFilterService", void 0);
__decorate([
    Autowired('advancedFilterExpressionService')
], AdvancedFilterBuilderComp.prototype, "advancedFilterExpressionService", void 0);
__decorate([
    Autowired('beans')
], AdvancedFilterBuilderComp.prototype, "beans", void 0);
__decorate([
    PostConstruct
], AdvancedFilterBuilderComp.prototype, "postConstruct", null);
//# sourceMappingURL=advancedFilterBuilderComp.js.map
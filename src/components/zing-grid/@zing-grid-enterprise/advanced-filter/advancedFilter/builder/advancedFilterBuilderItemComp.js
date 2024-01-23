var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, DragAndDropService, DragSourceType, Events, KeyCode, PostConstruct, RefSelector, TabGuardComp, TooltipFeature, _ } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { AddDropdownComp } from "./addDropdownComp";
import { AdvancedFilterBuilderDragFeature } from "./advancedFilterBuilderDragFeature";
import { AdvancedFilterBuilderItemNavigationFeature } from "./advancedFilterBuilderItemNavigationFeature";
import { getAdvancedFilterBuilderAddButtonParams } from "./advancedFilterBuilderUtils";
import { ConditionPillWrapperComp } from "./conditionPillWrapperComp";
import { AdvancedFilterBuilderEvents } from "./iAdvancedFilterBuilder";
import { InputPillComp } from "./inputPillComp";
import { JoinPillWrapperComp } from "./joinPillWrapperComp";
import { SelectPillComp } from "./selectPillComp";
export class AdvancedFilterBuilderItemComp extends TabGuardComp {
    constructor(item, dragFeature, focusWrapper) {
        super( `
            <div class="zing-advanced-filter-builder-item-wrapper" role="presentation">
                <div ref="eItem" class="zing-advanced-filter-builder-item" role="presentation">
                    <div ref="eTreeLines" class="zing-advanced-filter-builder-item-tree-lines" aria-hidden="true"></div>
                    <span ref="eDragHandle" class="zing-drag-handle" aria-hidden="true"></span>
                    <span ref="eValidation" class="zing-advanced-filter-builder-item-button zing-advanced-filter-builder-invalid" aria-hidden="true"></span>
                </div>
                <div ref="eButtons" class="zing-advanced-filter-builder-item-buttons">
                    <span ref="eMoveUpButton" class="zing-advanced-filter-builder-item-button" role="button"></span>
                    <span ref="eMoveDownButton" class="zing-advanced-filter-builder-item-button" role="button"></span>
                    <div ref="eAddButton" role="presentation"></div>
                    <span ref="eRemoveButton" class="zing-advanced-filter-builder-item-button" role="button"></span>
                </div>
            </div>
        `);
        this.item = item;
        this.dragFeature = dragFeature;
        this.focusWrapper = focusWrapper;
        this.moveUpDisabled = false;
        this.moveDownDisabled = false;
    }
    postConstruct() {
        const { filterModel, level, showMove } = this.item;
        const isJoin = filterModel.filterType === 'join';
        this.ePillWrapper = this.createManagedBean(isJoin ? new JoinPillWrapperComp() : new ConditionPillWrapperComp());
        this.ePillWrapper.init({ item: this.item, createPill: (params) => this.createPill(params) });
        this.eDragHandle.insertAdjacentElement('afterend', this.ePillWrapper.getGui());
        if (level === 0) {
            const eTreeLine = document.createElement('div');
            eTreeLine.classList.add('zing-advanced-filter-builder-item-tree-line-vertical-bottom');
            eTreeLine.classList.add('zing-advanced-filter-builder-item-tree-line-root');
            this.eTreeLines.appendChild(eTreeLine);
            _.setDisplayed(this.eDragHandle, false);
            _.setDisplayed(this.eButtons, false);
            _.setAriaExpanded(this.focusWrapper, true);
        }
        else {
            this.setupTreeLines(level);
            this.eDragHandle.appendChild(_.createIconNoSpan('advancedFilterBuilderDrag', this.gridOptionsService));
            this.setupValidation();
            this.setupMoveButtons(showMove);
            this.setupAddButton();
            this.setupRemoveButton();
            this.setupDragging();
            this.updateAriaExpanded();
        }
        _.setAriaLevel(this.focusWrapper, level + 1);
        this.initialiseTabGuard({});
        this.createManagedBean(new AdvancedFilterBuilderItemNavigationFeature(this.getGui(), this.focusWrapper, this.ePillWrapper));
        this.updateAriaLabel();
        this.addManagedListener(this.ePillWrapper, AdvancedFilterBuilderEvents.EVENT_VALUE_CHANGED, () => this.dispatchEvent({
            type: AdvancedFilterBuilderEvents.EVENT_VALUE_CHANGED
        }));
        this.addManagedListener(this.ePillWrapper, AdvancedFilterBuilderEvents.EVENT_VALID_CHANGED, () => this.updateValidity());
    }
    setState(params) {
        const { level } = this.item;
        if (level === 0) {
            return;
        }
        const { showMove } = this.item;
        const { disableMoveUp, disableMoveDown, treeLines, showStartTreeLine } = params;
        this.updateTreeLines(treeLines, showStartTreeLine);
        this.updateAriaExpanded();
        if (showMove) {
            this.moveUpDisabled = !!disableMoveUp;
            this.moveDownDisabled = !!disableMoveDown;
            this.eMoveUpButton.classList.toggle('zing-advanced-filter-builder-item-button-disabled', disableMoveUp);
            this.eMoveDownButton.classList.toggle('zing-advanced-filter-builder-item-button-disabled', disableMoveDown);
            _.setAriaDisabled(this.eMoveUpButton, !!disableMoveUp);
            _.setAriaDisabled(this.eMoveDownButton, !!disableMoveDown);
            this.moveUpTooltipFeature.refreshToolTip();
            this.moveDownTooltipFeature.refreshToolTip();
        }
    }
    focusMoveButton(backwards) {
        (backwards ? this.eMoveUpButton : this.eMoveDownButton).focus();
    }
    afterAdd() {
        this.ePillWrapper.getFocusableElement().focus();
    }
    setupTreeLines(level) {
        for (let i = 0; i < level; i++) {
            const eTreeLine = document.createElement('div');
            this.eTreeLines.appendChild(eTreeLine);
        }
    }
    updateTreeLines(treeLines, showStartTreeLine) {
        const lastTreeLineIndex = treeLines.length - 1;
        const { children } = this.eTreeLines;
        for (let i = 0; i < lastTreeLineIndex; i++) {
            const eTreeLine = children.item(i);
            if (eTreeLine) {
                eTreeLine.classList.toggle('zing-advanced-filter-builder-item-tree-line-vertical', !treeLines[i]);
            }
        }
        const eTreeLine = children.item(lastTreeLineIndex);
        if (eTreeLine) {
            eTreeLine.classList.add('zing-advanced-filter-builder-item-tree-line-horizontal');
            const isLastChild = treeLines[lastTreeLineIndex];
            eTreeLine.classList.toggle('zing-advanced-filter-builder-item-tree-line-vertical-top', isLastChild);
            eTreeLine.classList.toggle('zing-advanced-filter-builder-item-tree-line-vertical', !isLastChild);
        }
        this.eDragHandle.classList.toggle('zing-advanced-filter-builder-item-tree-line-vertical-bottom', showStartTreeLine);
    }
    setupValidation() {
        this.eValidation.appendChild(_.createIconNoSpan('advancedFilterBuilderInvalid', this.gridOptionsService));
        this.validationTooltipFeature = this.createManagedBean(new TooltipFeature({
            getGui: () => this.eValidation,
            getLocation: () => 'advancedFilter',
            getTooltipValue: () => this.ePillWrapper.getValidationMessage(),
            getTooltipShowDelayOverride: () => 1000
        }, this.beans));
        this.validationTooltipFeature.setComp(this.eValidation);
        this.updateValidity();
    }
    setupAddButton() {
        var _a;
        const addButtonParams = getAdvancedFilterBuilderAddButtonParams(key => this.advancedFilterExpressionService.translate(key), (_a = this.gridOptionsService.get('advancedFilterBuilderParams')) === null || _a === void 0 ? void 0 : _a.addSelectWidth);
        const eAddButton = this.createManagedBean(new AddDropdownComp(addButtonParams));
        this.addManagedListener(eAddButton, Events.EVENT_FIELD_PICKER_VALUE_SELECTED, ({ value }) => this.dispatchEvent({
            type: AdvancedFilterBuilderEvents.EVENT_ADDED,
            item: this.item,
            isJoin: value.key === 'join'
        }));
        this.eAddButton.appendChild(eAddButton.getGui());
        const tooltipFeature = this.createManagedBean(new TooltipFeature({
            getGui: () => this.eAddButton,
            getLocation: () => 'advancedFilter',
            getTooltipValue: () => this.advancedFilterExpressionService.translate('advancedFilterBuilderAddButtonTooltip')
        }, this.beans));
        tooltipFeature.setComp(this.eAddButton);
    }
    setupRemoveButton() {
        this.eRemoveButton.appendChild(_.createIconNoSpan('advancedFilterBuilderRemove', this.gridOptionsService));
        this.addManagedListener(this.eRemoveButton, 'click', () => this.removeItem());
        this.addManagedListener(this.eRemoveButton, 'keydown', (event) => {
            switch (event.key) {
                case KeyCode.ENTER:
                    event.preventDefault();
                    _.stopPropagationForZingGrid(event);
                    this.removeItem();
                    break;
            }
        });
        const tooltipFeature = this.createManagedBean(new TooltipFeature({
            getGui: () => this.eRemoveButton,
            getLocation: () => 'advancedFilter',
            getTooltipValue: () => this.advancedFilterExpressionService.translate('advancedFilterBuilderRemoveButtonTooltip')
        }, this.beans));
        tooltipFeature.setComp(this.eRemoveButton);
        _.setAriaLabel(this.eRemoveButton, this.advancedFilterExpressionService.translate('advancedFilterBuilderRemoveButtonTooltip'));
        this.activateTabIndex([this.eRemoveButton]);
    }
    setupMoveButtons(showMove) {
        if (showMove) {
            this.eMoveUpButton.appendChild(_.createIconNoSpan('advancedFilterBuilderMoveUp', this.gridOptionsService));
            this.addManagedListener(this.eMoveUpButton, 'click', () => this.moveItem(true));
            this.addManagedListener(this.eMoveUpButton, 'keydown', (event) => {
                switch (event.key) {
                    case KeyCode.ENTER:
                        event.preventDefault();
                        _.stopPropagationForZingGrid(event);
                        this.moveItem(true);
                        break;
                }
            });
            this.moveUpTooltipFeature = this.createManagedBean(new TooltipFeature({
                getGui: () => this.eMoveUpButton,
                getLocation: () => 'advancedFilter',
                getTooltipValue: () => this.moveUpDisabled
                    ? null
                    : this.advancedFilterExpressionService.translate('advancedFilterBuilderMoveUpButtonTooltip')
            }, this.beans));
            this.moveUpTooltipFeature.setComp(this.eMoveUpButton);
            _.setAriaLabel(this.eMoveUpButton, this.advancedFilterExpressionService.translate('advancedFilterBuilderMoveUpButtonTooltip'));
            this.eMoveDownButton.appendChild(_.createIconNoSpan('advancedFilterBuilderMoveDown', this.gridOptionsService));
            this.addManagedListener(this.eMoveDownButton, 'click', () => this.moveItem(false));
            this.addManagedListener(this.eMoveDownButton, 'keydown', (event) => {
                switch (event.key) {
                    case KeyCode.ENTER:
                        event.preventDefault();
                        _.stopPropagationForZingGrid(event);
                        this.moveItem(false);
                        break;
                }
            });
            this.moveDownTooltipFeature = this.createManagedBean(new TooltipFeature({
                getGui: () => this.eMoveDownButton,
                getLocation: () => 'advancedFilter',
                getTooltipValue: () => this.moveDownDisabled
                    ? null
                    : this.advancedFilterExpressionService.translate('advancedFilterBuilderMoveDownButtonTooltip')
            }, this.beans));
            this.moveDownTooltipFeature.setComp(this.eMoveDownButton);
            _.setAriaLabel(this.eMoveDownButton, this.advancedFilterExpressionService.translate('advancedFilterBuilderMoveDownButtonTooltip'));
            this.activateTabIndex([this.eMoveUpButton, this.eMoveDownButton]);
        }
        else {
            _.setDisplayed(this.eMoveUpButton, false);
            _.setDisplayed(this.eMoveDownButton, false);
        }
    }
    updateValidity() {
        _.setVisible(this.eValidation, !this.item.valid);
        this.validationTooltipFeature.refreshToolTip();
        this.updateAriaLabel();
    }
    createPill(params) {
        var _a, _b;
        const { key, displayValue, cssClass, update, ariaLabel } = params;
        const onUpdated = (key) => {
            if (key == null) {
                return;
            }
            update(key);
            this.dispatchEvent({
                type: AdvancedFilterBuilderEvents.EVENT_VALUE_CHANGED
            });
        };
        if (params.isSelect) {
            const { getEditorParams, pickerAriaLabelKey, pickerAriaLabelValue } = params;
            const advancedFilterBuilderParams = this.gridOptionsService.get('advancedFilterBuilderParams');
            const minPickerWidth = `${(_a = advancedFilterBuilderParams === null || advancedFilterBuilderParams === void 0 ? void 0 : advancedFilterBuilderParams.pillSelectMinWidth) !== null && _a !== void 0 ? _a : 140}px`;
            const maxPickerWidth = `${(_b = advancedFilterBuilderParams === null || advancedFilterBuilderParams === void 0 ? void 0 : advancedFilterBuilderParams.pillSelectMaxWidth) !== null && _b !== void 0 ? _b : 200}px`;
            const comp = this.createBean(new SelectPillComp({
                pickerAriaLabelKey,
                pickerAriaLabelValue,
                pickerType: 'zing-list',
                value: {
                    key,
                    displayValue
                },
                valueFormatter: (value) => { var _a; return value == null ? null : (_a = value.displayValue) !== null && _a !== void 0 ? _a : value.key; },
                variableWidth: true,
                minPickerWidth,
                maxPickerWidth,
                getEditorParams,
                wrapperClassName: cssClass,
                ariaLabel
            }));
            this.addManagedListener(comp, Events.EVENT_FIELD_PICKER_VALUE_SELECTED, ({ value }) => onUpdated(value === null || value === void 0 ? void 0 : value.key));
            return comp;
        }
        else {
            const comp = this.createBean(new InputPillComp({
                value: displayValue,
                cssClass,
                type: this.getInputType(params.baseCellDataType),
                ariaLabel
            }));
            this.addManagedListener(comp, Events.EVENT_FIELD_VALUE_CHANGED, ({ value }) => onUpdated(value));
            return comp;
        }
    }
    getInputType(baseCellDataType) {
        switch (baseCellDataType) {
            case 'text':
            case 'object':
            case 'boolean':
                return 'text';
            case 'number':
                return 'number';
            case 'date':
            case 'dateString':
                return 'date';
        }
    }
    setupDragging() {
        const dragSource = {
            type: DragSourceType.AdvancedFilterBuilder,
            eElement: this.eDragHandle,
            dragItemName: () => this.ePillWrapper.getDragName(),
            getDefaultIconName: () => DragAndDropService.ICON_NOT_ALLOWED,
            getDragItem: () => ({}),
            onDragStarted: () => this.dragFeature.dispatchEvent({
                type: AdvancedFilterBuilderDragFeature.EVENT_DRAG_STARTED,
                item: this.item
            }),
            onDragStopped: () => this.dragFeature.dispatchEvent({
                type: AdvancedFilterBuilderDragFeature.EVENT_DRAG_ENDED
            })
        };
        this.dragAndDropService.addDragSource(dragSource, true);
        this.addDestroyFunc(() => this.dragAndDropService.removeDragSource(dragSource));
    }
    updateAriaLabel() {
        const wrapperLabel = this.ePillWrapper.getAriaLabel();
        const level = `${this.item.level + 1}`;
        const validationMessage = this.ePillWrapper.getValidationMessage();
        let ariaLabel;
        if (validationMessage) {
            ariaLabel = this.advancedFilterExpressionService.translate('ariaAdvancedFilterBuilderItemValidation', [wrapperLabel, level, validationMessage]);
        }
        else {
            ariaLabel = this.advancedFilterExpressionService.translate('ariaAdvancedFilterBuilderItem', [wrapperLabel, level]);
        }
        _.setAriaLabel(this.focusWrapper, ariaLabel);
    }
    updateAriaExpanded() {
        _.removeAriaExpanded(this.focusWrapper);
        const { filterModel } = this.item;
        if ((filterModel === null || filterModel === void 0 ? void 0 : filterModel.filterType) === 'join' && filterModel.conditions.length) {
            _.setAriaExpanded(this.focusWrapper, true);
        }
    }
    removeItem() {
        this.dispatchEvent({
            type: AdvancedFilterBuilderEvents.EVENT_REMOVED,
            item: this.item
        });
    }
    moveItem(backwards) {
        this.dispatchEvent({
            type: AdvancedFilterBuilderEvents.EVENT_MOVED,
            item: this.item,
            backwards
        });
    }
}
__decorate([
    RefSelector('eTreeLines')
], AdvancedFilterBuilderItemComp.prototype, "eTreeLines", void 0);
__decorate([
    RefSelector('eDragHandle')
], AdvancedFilterBuilderItemComp.prototype, "eDragHandle", void 0);
__decorate([
    RefSelector('eItem')
], AdvancedFilterBuilderItemComp.prototype, "eItem", void 0);
__decorate([
    RefSelector('eButtons')
], AdvancedFilterBuilderItemComp.prototype, "eButtons", void 0);
__decorate([
    RefSelector('eValidation')
], AdvancedFilterBuilderItemComp.prototype, "eValidation", void 0);
__decorate([
    RefSelector('eMoveUpButton')
], AdvancedFilterBuilderItemComp.prototype, "eMoveUpButton", void 0);
__decorate([
    RefSelector('eMoveDownButton')
], AdvancedFilterBuilderItemComp.prototype, "eMoveDownButton", void 0);
__decorate([
    RefSelector('eAddButton')
], AdvancedFilterBuilderItemComp.prototype, "eAddButton", void 0);
__decorate([
    RefSelector('eRemoveButton')
], AdvancedFilterBuilderItemComp.prototype, "eRemoveButton", void 0);
__decorate([
    Autowired('beans')
], AdvancedFilterBuilderItemComp.prototype, "beans", void 0);
__decorate([
    Autowired('dragAndDropService')
], AdvancedFilterBuilderItemComp.prototype, "dragAndDropService", void 0);
__decorate([
    Autowired('advancedFilterExpressionService')
], AdvancedFilterBuilderItemComp.prototype, "advancedFilterExpressionService", void 0);
__decorate([
    PostConstruct
], AdvancedFilterBuilderItemComp.prototype, "postConstruct", null);

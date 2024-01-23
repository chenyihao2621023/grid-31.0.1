var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { PostConstruct } from '../context/context';
import { Component } from '../widgets/component';
import { Events } from '../events';
import { RefSelector } from '../widgets/componentAnnotations';
import { RowNode } from '../entities/rowNode';
import { stopPropagationForZingGrid } from '../utils/event';
import { getAriaCheckboxStateName, setAriaLive } from '../utils/aria';
export class CheckboxSelectionComponent extends Component {
  constructor() {
    super(`
            <div class="zing-selection-checkbox" role="presentation">
                <zing-checkbox role="presentation" ref="eCheckbox"></zing-checkbox>
            </div>`);
  }
  postConstruct() {
    this.eCheckbox.setPassive(true);
    setAriaLive(this.eCheckbox.getInputElement(), 'polite');
  }
  getCheckboxId() {
    return this.eCheckbox.getInputElement().id;
  }
  onDataChanged() {
    this.onSelectionChanged();
  }
  onSelectableChanged() {
    this.showOrHideSelect();
  }
  onSelectionChanged() {
    const translate = this.localeService.getLocaleTextFunc();
    const state = this.rowNode.isSelected();
    const stateName = getAriaCheckboxStateName(translate, state);
    const ariaLabel = translate('ariaRowToggleSelection', 'Press Space to toggle row selection');
    this.eCheckbox.setValue(state, true);
    this.eCheckbox.setInputAriaLabel(`${ariaLabel} (${stateName})`);
  }
  onClicked(newValue, groupSelectsFiltered, event) {
    return this.rowNode.setSelectedParams({
      newValue,
      rangeSelect: event.shiftKey,
      groupSelectsFiltered,
      event,
      source: 'checkboxSelected'
    });
  }
  init(params) {
    this.rowNode = params.rowNode;
    this.column = params.column;
    this.overrides = params.overrides;
    this.onSelectionChanged();
    this.addManagedListener(this.eCheckbox.getInputElement(), 'dblclick', event => {
      stopPropagationForZingGrid(event);
    });
    this.addManagedListener(this.eCheckbox.getInputElement(), 'click', event => {
      stopPropagationForZingGrid(event);
      const groupSelectsFiltered = this.gridOptionsService.get('groupSelectsFiltered');
      const isSelected = this.eCheckbox.getValue();
      if (this.shouldHandleIndeterminateState(isSelected, groupSelectsFiltered)) {
        const result = this.onClicked(true, groupSelectsFiltered, event || {});
        if (result === 0) {
          this.onClicked(false, groupSelectsFiltered, event);
        }
      } else if (isSelected) {
        this.onClicked(false, groupSelectsFiltered, event);
      } else {
        this.onClicked(true, groupSelectsFiltered, event || {});
      }
    });
    this.addManagedListener(this.rowNode, RowNode.EVENT_ROW_SELECTED, this.onSelectionChanged.bind(this));
    this.addManagedListener(this.rowNode, RowNode.EVENT_DATA_CHANGED, this.onDataChanged.bind(this));
    this.addManagedListener(this.rowNode, RowNode.EVENT_SELECTABLE_CHANGED, this.onSelectableChanged.bind(this));
    const isRowSelectableFunc = this.gridOptionsService.get('isRowSelectable');
    const checkboxVisibleIsDynamic = isRowSelectableFunc || typeof this.getIsVisible() === 'function';
    if (checkboxVisibleIsDynamic) {
      const showOrHideSelectListener = this.showOrHideSelect.bind(this);
      this.addManagedListener(this.eventService, Events.EVENT_DISPLAYED_COLUMNS_CHANGED, showOrHideSelectListener);
      this.addManagedListener(this.rowNode, RowNode.EVENT_DATA_CHANGED, showOrHideSelectListener);
      this.addManagedListener(this.rowNode, RowNode.EVENT_CELL_CHANGED, showOrHideSelectListener);
      this.showOrHideSelect();
    }
    this.eCheckbox.getInputElement().setAttribute('tabindex', '-1');
  }
  shouldHandleIndeterminateState(isSelected, groupSelectsFiltered) {
    return groupSelectsFiltered && (this.eCheckbox.getPreviousValue() === undefined || isSelected === undefined) && this.gridOptionsService.isRowModelType('clientSide');
  }
  showOrHideSelect() {
    var _a, _b, _c, _d;
    let selectable = this.rowNode.selectable;
    const isVisible = this.getIsVisible();
    if (selectable) {
      if (typeof isVisible === 'function') {
        const extraParams = (_a = this.overrides) === null || _a === void 0 ? void 0 : _a.callbackParams;
        const params = (_b = this.column) === null || _b === void 0 ? void 0 : _b.createColumnFunctionCallbackParams(this.rowNode);
        selectable = params ? isVisible(Object.assign(Object.assign({}, extraParams), params)) : false;
      } else {
        selectable = isVisible !== null && isVisible !== void 0 ? isVisible : false;
      }
    }
    const disableInsteadOfHide = (_c = this.column) === null || _c === void 0 ? void 0 : _c.getColDef().showDisabledCheckboxes;
    if (disableInsteadOfHide) {
      this.eCheckbox.setDisabled(!selectable);
      this.setVisible(true);
      this.setDisplayed(true);
      return;
    }
    if ((_d = this.overrides) === null || _d === void 0 ? void 0 : _d.removeHidden) {
      this.setDisplayed(selectable);
      return;
    }
    this.setVisible(selectable);
  }
  getIsVisible() {
    var _a, _b;
    if (this.overrides) {
      return this.overrides.isVisible;
    }
    return (_b = (_a = this.column) === null || _a === void 0 ? void 0 : _a.getColDef()) === null || _b === void 0 ? void 0 : _b.checkboxSelection;
  }
}
__decorate([RefSelector('eCheckbox')], CheckboxSelectionComponent.prototype, "eCheckbox", void 0);
__decorate([PostConstruct], CheckboxSelectionComponent.prototype, "postConstruct", null);
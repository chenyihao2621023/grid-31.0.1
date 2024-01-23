import { Component } from '../../../widgets/component';
import { SimpleFilter } from '../../provided/simpleFilter';
import { OptionsFactory } from '../../provided/optionsFactory';
export class SimpleFloatingFilter extends Component {
  getDefaultDebounceMs() {
    return 0;
  }
  destroy() {
    super.destroy();
  }
  isEventFromFloatingFilter(event) {
    return event && event.afterFloatingFilter;
  }
  isEventFromDataChange(event) {
    return event === null || event === void 0 ? void 0 : event.afterDataChange;
  }
  getLastType() {
    return this.lastType;
  }
  isReadOnly() {
    return this.readOnly;
  }
  setLastTypeFromModel(model) {
    if (!model) {
      this.lastType = this.optionsFactory.getDefaultOption();
      return;
    }
    const isCombined = model.operator;
    let condition;
    if (isCombined) {
      const combinedModel = model;
      condition = combinedModel.conditions[0];
    } else {
      condition = model;
    }
    this.lastType = condition.type;
  }
  canWeEditAfterModelFromParentFilter(model) {
    if (!model) {
      return this.isTypeEditable(this.lastType);
    }
    const isCombined = model.operator;
    if (isCombined) {
      return false;
    }
    const simpleModel = model;
    return this.isTypeEditable(simpleModel.type);
  }
  init(params) {
    this.setSimpleParams(params, false);
  }
  setSimpleParams(params, update = true) {
    this.optionsFactory = new OptionsFactory();
    this.optionsFactory.init(params.filterParams, this.getDefaultFilterOptions());
    if (!update) {
      this.lastType = this.optionsFactory.getDefaultOption();
    }
    this.readOnly = !!params.filterParams.readOnly;
    const editable = this.isTypeEditable(this.lastType);
    this.setEditable(editable);
  }
  onParamsUpdated(params) {
    this.setSimpleParams(params);
  }
  doesFilterHaveSingleInput(filterType) {
    const customFilterOption = this.optionsFactory.getCustomOption(filterType);
    const {
      numberOfInputs
    } = customFilterOption || {};
    return numberOfInputs == null || numberOfInputs == 1;
  }
  isTypeEditable(type) {
    const uneditableTypes = [SimpleFilter.IN_RANGE, SimpleFilter.EMPTY, SimpleFilter.BLANK, SimpleFilter.NOT_BLANK];
    return !!type && !this.isReadOnly() && this.doesFilterHaveSingleInput(type) && uneditableTypes.indexOf(type) < 0;
  }
}
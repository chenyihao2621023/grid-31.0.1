var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired } from "../../context/context";
import { Component } from "../../widgets/component";
import { exists } from "../../utils/generic";
import { clearElement } from "../../utils/dom";
const ARROW_UP = '\u2191';
const ARROW_DOWN = '\u2193';
export class AnimateShowChangeCellRenderer extends Component {
  constructor() {
    super(AnimateShowChangeCellRenderer.TEMPLATE);
    this.refreshCount = 0;
  }
  init(params) {
    this.eValue = this.queryForHtmlElement('.zing-value-change-value');
    this.eDelta = this.queryForHtmlElement('.zing-value-change-delta');
    this.refresh(params);
  }
  showDelta(params, delta) {
    const absDelta = Math.abs(delta);
    const valueFormatted = params.formatValue(absDelta);
    const valueToUse = exists(valueFormatted) ? valueFormatted : absDelta;
    const deltaUp = delta >= 0;
    if (deltaUp) {
      this.eDelta.innerHTML = ARROW_UP + valueToUse;
    } else {
      this.eDelta.innerHTML = ARROW_DOWN + valueToUse;
    }
    this.eDelta.classList.toggle('zing-value-change-delta-up', deltaUp);
    this.eDelta.classList.toggle('zing-value-change-delta-down', !deltaUp);
  }
  setTimerToRemoveDelta() {
    this.refreshCount++;
    const refreshCountCopy = this.refreshCount;
    window.setTimeout(() => {
      if (refreshCountCopy === this.refreshCount) {
        this.hideDeltaValue();
      }
    }, 2000);
  }
  hideDeltaValue() {
    this.eValue.classList.remove('zing-value-change-value-highlight');
    clearElement(this.eDelta);
  }
  refresh(params) {
    const value = params.value;
    if (value === this.lastValue) {
      return false;
    }
    if (exists(params.valueFormatted)) {
      this.eValue.innerHTML = params.valueFormatted;
    } else if (exists(params.value)) {
      this.eValue.innerHTML = value;
    } else {
      clearElement(this.eValue);
    }
    if (this.filterManager.isSuppressFlashingCellsBecauseFiltering()) {
      return false;
    }
    if (typeof value === 'number' && typeof this.lastValue === 'number') {
      const delta = value - this.lastValue;
      this.showDelta(params, delta);
    }
    if (this.lastValue) {
      this.eValue.classList.add('zing-value-change-value-highlight');
    }
    this.setTimerToRemoveDelta();
    this.lastValue = value;
    return true;
  }
}
AnimateShowChangeCellRenderer.TEMPLATE = '<span>' + '<span class="zing-value-change-delta"></span>' + '<span class="zing-value-change-value"></span>' + '</span>';
__decorate([Autowired('filterManager')], AnimateShowChangeCellRenderer.prototype, "filterManager", void 0);
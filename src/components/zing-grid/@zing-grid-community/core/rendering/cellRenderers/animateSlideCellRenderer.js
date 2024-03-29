var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired } from "../../context/context";
import { Component } from "../../widgets/component";
import { loadTemplate, clearElement } from "../../utils/dom";
import { missing, exists } from "../../utils/generic";
export class AnimateSlideCellRenderer extends Component {
  constructor() {
    super(AnimateSlideCellRenderer.TEMPLATE);
    this.refreshCount = 0;
    this.eCurrent = this.queryForHtmlElement('.zing-value-slide-current');
  }
  init(params) {
    this.refresh(params);
  }
  addSlideAnimation() {
    this.refreshCount++;
    const refreshCountCopy = this.refreshCount;
    if (this.ePrevious) {
      this.getGui().removeChild(this.ePrevious);
    }
    this.ePrevious = loadTemplate('<span class="zing-value-slide-previous zing-value-slide-out"></span>');
    this.ePrevious.innerHTML = this.eCurrent.innerHTML;
    this.getGui().insertBefore(this.ePrevious, this.eCurrent);
    window.setTimeout(() => {
      if (refreshCountCopy !== this.refreshCount) {
        return;
      }
      this.ePrevious.classList.add('zing-value-slide-out-end');
    }, 50);
    window.setTimeout(() => {
      if (refreshCountCopy !== this.refreshCount) {
        return;
      }
      this.getGui().removeChild(this.ePrevious);
      this.ePrevious = null;
    }, 3000);
  }
  refresh(params) {
    let value = params.value;
    if (missing(value)) {
      value = '';
    }
    if (value === this.lastValue) {
      return false;
    }
    if (this.filterManager.isSuppressFlashingCellsBecauseFiltering()) {
      return false;
    }
    this.addSlideAnimation();
    this.lastValue = value;
    if (exists(params.valueFormatted)) {
      this.eCurrent.innerHTML = params.valueFormatted;
    } else if (exists(params.value)) {
      this.eCurrent.innerHTML = value;
    } else {
      clearElement(this.eCurrent);
    }
    return true;
  }
}
AnimateSlideCellRenderer.TEMPLATE = `<span>
            <span class="zing-value-slide-current"></span>
        </span>`;
__decorate([Autowired('filterManager')], AnimateSlideCellRenderer.prototype, "filterManager", void 0);
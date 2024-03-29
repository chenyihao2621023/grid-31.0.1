var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { PopupComponent } from "../../widgets/popupComponent";
import { RefSelector } from "../../widgets/componentAnnotations";
import { isBrowserSafari } from "../../utils/browser";
import { KeyCode } from '../../constants/keyCode';
export class SimpleCellEditor extends PopupComponent {
  constructor(cellEditorInput) {
    super(`
            <div class="zing-cell-edit-wrapper">
                ${cellEditorInput.getTemplate()}
            </div>`);
    this.cellEditorInput = cellEditorInput;
  }
  init(params) {
    this.params = params;
    const eInput = this.eInput;
    this.cellEditorInput.init(eInput, params);
    let startValue;
    if (params.cellStartedEdit) {
      this.focusAfterAttached = true;
      const eventKey = params.eventKey;
      if (eventKey === KeyCode.BACKSPACE || params.eventKey === KeyCode.DELETE) {
        startValue = '';
      } else if (eventKey && eventKey.length === 1) {
        startValue = eventKey;
      } else {
        startValue = this.cellEditorInput.getStartValue();
        if (eventKey !== KeyCode.F2) {
          this.highlightAllOnFocus = true;
        }
      }
    } else {
      this.focusAfterAttached = false;
      startValue = this.cellEditorInput.getStartValue();
    }
    if (startValue != null) {
      eInput.setStartValue(startValue);
    }
    this.addManagedListener(eInput.getGui(), 'keydown', event => {
      const {
        key
      } = event;
      if (key === KeyCode.PAGE_UP || key === KeyCode.PAGE_DOWN) {
        event.preventDefault();
      }
    });
  }
  afterGuiAttached() {
    var _a, _b;
    const translate = this.localeService.getLocaleTextFunc();
    const eInput = this.eInput;
    eInput.setInputAriaLabel(translate('ariaInputEditor', 'Input Editor'));
    if (!this.focusAfterAttached) {
      return;
    }
    if (!isBrowserSafari()) {
      eInput.getFocusableElement().focus();
    }
    const inputEl = eInput.getInputElement();
    if (this.highlightAllOnFocus) {
      inputEl.select();
    } else {
      (_b = (_a = this.cellEditorInput).setCaret) === null || _b === void 0 ? void 0 : _b.call(_a);
    }
  }
  focusIn() {
    const eInput = this.eInput;
    const focusEl = eInput.getFocusableElement();
    const inputEl = eInput.getInputElement();
    focusEl.focus();
    inputEl.select();
  }
  getValue() {
    return this.cellEditorInput.getValue();
  }
  isPopup() {
    return false;
  }
}
__decorate([RefSelector('eInput')], SimpleCellEditor.prototype, "eInput", void 0);
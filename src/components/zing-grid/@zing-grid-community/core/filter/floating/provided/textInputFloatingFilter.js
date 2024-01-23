var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { RefSelector } from '../../../widgets/componentAnnotations';
import { debounce } from '../../../utils/function';
import { ProvidedFilter } from '../../provided/providedFilter';
import { PostConstruct, Autowired } from '../../../context/context';
import { SimpleFloatingFilter } from './simpleFloatingFilter';
import { ZingInputTextField } from '../../../widgets/zingInputTextField';
import { KeyCode } from '../../../constants/keyCode';
import { TextFilter } from '../../provided/text/textFilter';
import { BeanStub } from '../../../context/beanStub';
import { clearElement } from '../../../utils/dom';
export class FloatingFilterTextInputService extends BeanStub {
  constructor(params) {
    super();
    this.params = params;
    this.valueChangedListener = () => {};
  }
  setupGui(parentElement) {
    var _a;
    this.eFloatingFilterTextInput = this.createManagedBean(new ZingInputTextField((_a = this.params) === null || _a === void 0 ? void 0 : _a.config));
    const eInput = this.eFloatingFilterTextInput.getGui();
    parentElement.appendChild(eInput);
    this.addManagedListener(eInput, 'input', e => this.valueChangedListener(e));
    this.addManagedListener(eInput, 'keydown', e => this.valueChangedListener(e));
  }
  setEditable(editable) {
    this.eFloatingFilterTextInput.setDisabled(!editable);
  }
  setAutoComplete(autoComplete) {
    this.eFloatingFilterTextInput.setAutoComplete(autoComplete);
  }
  getValue() {
    return this.eFloatingFilterTextInput.getValue();
  }
  setValue(value, silent) {
    this.eFloatingFilterTextInput.setValue(value, silent);
  }
  setValueChangedListener(listener) {
    this.valueChangedListener = listener;
  }
  setParams(params) {
    this.setAriaLabel(params.ariaLabel);
    if (params.autoComplete !== undefined) {
      this.setAutoComplete(params.autoComplete);
    }
  }
  setAriaLabel(ariaLabel) {
    this.eFloatingFilterTextInput.setInputAriaLabel(ariaLabel);
  }
}
;
export class TextInputFloatingFilter extends SimpleFloatingFilter {
  postConstruct() {
    this.setTemplate(`
            <div class="zing-floating-filter-input" role="presentation" ref="eFloatingFilterInputContainer"></div>
        `);
  }
  getDefaultDebounceMs() {
    return 500;
  }
  onParentModelChanged(model, event) {
    if (this.isEventFromFloatingFilter(event) || this.isEventFromDataChange(event)) {
      return;
    }
    this.setLastTypeFromModel(model);
    this.setEditable(this.canWeEditAfterModelFromParentFilter(model));
    this.floatingFilterInputService.setValue(this.getFilterModelFormatter().getModelAsString(model));
  }
  init(params) {
    this.setupFloatingFilterInputService(params);
    super.init(params);
    this.setTextInputParams(params);
  }
  setupFloatingFilterInputService(params) {
    this.floatingFilterInputService = this.createFloatingFilterInputService(params);
    this.floatingFilterInputService.setupGui(this.eFloatingFilterInputContainer);
  }
  setTextInputParams(params) {
    var _a;
    this.params = params;
    const autoComplete = (_a = params.browserAutoComplete) !== null && _a !== void 0 ? _a : false;
    this.floatingFilterInputService.setParams({
      ariaLabel: this.getAriaLabel(params),
      autoComplete
    });
    this.applyActive = ProvidedFilter.isUseApplyButton(this.params.filterParams);
    if (!this.isReadOnly()) {
      const debounceMs = ProvidedFilter.getDebounceMs(this.params.filterParams, this.getDefaultDebounceMs());
      const toDebounce = debounce(this.syncUpWithParentFilter.bind(this), debounceMs);
      this.floatingFilterInputService.setValueChangedListener(toDebounce);
    }
  }
  onParamsUpdated(params) {
    super.onParamsUpdated(params);
    this.setTextInputParams(params);
  }
  recreateFloatingFilterInputService(params) {
    const value = this.floatingFilterInputService.getValue();
    clearElement(this.eFloatingFilterInputContainer);
    this.destroyBean(this.floatingFilterInputService);
    this.setupFloatingFilterInputService(params);
    this.floatingFilterInputService.setValue(value, true);
  }
  getAriaLabel(params) {
    const displayName = this.columnModel.getDisplayNameForColumn(params.column, 'header', true);
    const translate = this.localeService.getLocaleTextFunc();
    return `${displayName} ${translate('ariaFilterInput', 'Filter Input')}`;
  }
  syncUpWithParentFilter(e) {
    const isEnterKey = e.key === KeyCode.ENTER;
    if (this.applyActive && !isEnterKey) {
      return;
    }
    let value = this.floatingFilterInputService.getValue();
    if (this.params.filterParams.trimInput) {
      value = TextFilter.trimInput(value);
      this.floatingFilterInputService.setValue(value, true);
    }
    this.params.parentFilterInstance(filterInstance => {
      if (filterInstance) {
        filterInstance.onFloatingFilterChanged(this.getLastType() || null, value || null);
      }
    });
  }
  setEditable(editable) {
    this.floatingFilterInputService.setEditable(editable);
  }
}
__decorate([Autowired('columnModel')], TextInputFloatingFilter.prototype, "columnModel", void 0);
__decorate([RefSelector('eFloatingFilterInputContainer')], TextInputFloatingFilter.prototype, "eFloatingFilterInputContainer", void 0);
__decorate([PostConstruct], TextInputFloatingFilter.prototype, "postConstruct", null);
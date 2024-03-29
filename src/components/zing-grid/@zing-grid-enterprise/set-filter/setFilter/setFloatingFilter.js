var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Component, RefSelector } from '@/components/zing-grid/@zing-grid-community/core/main.js';
import { SetFilter } from './setFilter';
import { SetFilterModelFormatter } from './setFilterModelFormatter';
import { SetValueModel } from './setValueModel';
export class SetFloatingFilterComp extends Component {
  constructor() {
    super(`
            <div class="zing-floating-filter-input zing-set-floating-filter-input" role="presentation">
                <zing-input-text-field ref="eFloatingFilterText"></zing-input-text-field>
            </div>`);
    this.availableValuesListenerAdded = false;
    this.filterModelFormatter = new SetFilterModelFormatter();
  }
  destroy() {
    super.destroy();
  }
  init(params) {
    this.params = params;
    this.eFloatingFilterText.setDisabled(true).addGuiEventListener('click', () => this.params.showParentFilter());
    this.setParams(params);
  }
  setParams(params) {
    const displayName = this.columnModel.getDisplayNameForColumn(params.column, 'header', true);
    const translate = this.localeService.getLocaleTextFunc();
    this.eFloatingFilterText.setInputAriaLabel(`${displayName} ${translate('ariaFilterInput', 'Filter Input')}`);
  }
  onParamsUpdated(params) {
    this.params = params;
    this.setParams(params);
  }
  onParentModelChanged(parentModel) {
    this.updateFloatingFilterText(parentModel);
  }
  parentSetFilterInstance(cb) {
    this.params.parentFilterInstance(filter => {
      if (!(filter instanceof SetFilter)) {
        throw new Error('ZING Grid - SetFloatingFilter expects SetFilter as its parent');
      }
      cb(filter);
    });
  }
  addAvailableValuesListener() {
    this.parentSetFilterInstance(setFilter => {
      const setValueModel = setFilter.getValueModel();
      if (!setValueModel) {
        return;
      }
      this.addManagedListener(setValueModel, SetValueModel.EVENT_AVAILABLE_VALUES_CHANGED, () => this.updateFloatingFilterText());
    });
    this.availableValuesListenerAdded = true;
  }
  updateFloatingFilterText(parentModel) {
    if (!this.availableValuesListenerAdded) {
      this.addAvailableValuesListener();
    }
    this.parentSetFilterInstance(setFilter => {
      this.eFloatingFilterText.setValue(this.filterModelFormatter.getModelAsString(parentModel, setFilter));
    });
  }
}
__decorate([RefSelector('eFloatingFilterText')], SetFloatingFilterComp.prototype, "eFloatingFilterText", void 0);
__decorate([Autowired('columnModel')], SetFloatingFilterComp.prototype, "columnModel", void 0);
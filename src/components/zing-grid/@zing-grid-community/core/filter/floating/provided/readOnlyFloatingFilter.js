var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component } from '../../../widgets/component';
import { RefSelector } from '../../../widgets/componentAnnotations';
import { Autowired } from '../../../context/context';
export class ReadOnlyFloatingFilter extends Component {
  constructor() {
    super(`
            <div class="zing-floating-filter-input" role="presentation">
                <zing-input-text-field ref="eFloatingFilterText"></zing-input-text-field>
            </div>`);
  }
  destroy() {
    super.destroy();
  }
  init(params) {
    this.params = params;
    const displayName = this.columnModel.getDisplayNameForColumn(params.column, 'header', true);
    const translate = this.localeService.getLocaleTextFunc();
    this.eFloatingFilterText.setDisabled(true).setInputAriaLabel(`${displayName} ${translate('ariaFilterInput', 'Filter Input')}`);
  }
  onParentModelChanged(parentModel) {
    if (!parentModel) {
      this.eFloatingFilterText.setValue('');
      return;
    }
    this.params.parentFilterInstance(filterInstance => {
      if (filterInstance.getModelAsString) {
        const modelAsString = filterInstance.getModelAsString(parentModel);
        this.eFloatingFilterText.setValue(modelAsString);
      }
    });
  }
  onParamsUpdated(params) {
    this.init(params);
  }
}
__decorate([RefSelector('eFloatingFilterText')], ReadOnlyFloatingFilter.prototype, "eFloatingFilterText", void 0);
__decorate([Autowired('columnModel')], ReadOnlyFloatingFilter.prototype, "columnModel", void 0);
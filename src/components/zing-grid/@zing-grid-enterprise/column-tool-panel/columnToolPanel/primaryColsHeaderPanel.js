var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, Autowired, Events, RefSelector, KeyCode, PostConstruct, Component } from "@/components/zing-grid/@zing-grid-community/core/main.js";
export var ExpandState;
(function (ExpandState) {
  ExpandState[ExpandState["EXPANDED"] = 0] = "EXPANDED";
  ExpandState[ExpandState["COLLAPSED"] = 1] = "COLLAPSED";
  ExpandState[ExpandState["INDETERMINATE"] = 2] = "INDETERMINATE";
})(ExpandState || (ExpandState = {}));
export class PrimaryColsHeaderPanel extends Component {
  constructor() {
    super(PrimaryColsHeaderPanel.TEMPLATE);
  }
  postConstruct() {
    this.createExpandIcons();
    this.addManagedListener(this.eExpand, 'click', this.onExpandClicked.bind(this));
    this.addManagedListener(this.eExpand, 'keydown', e => {
      if (e.key === KeyCode.SPACE) {
        e.preventDefault();
        this.onExpandClicked();
      }
    });
    this.addManagedListener(this.eSelect.getInputElement(), 'click', this.onSelectClicked.bind(this));
    this.addManagedPropertyListener('functionsReadOnly', () => this.onFunctionsReadOnlyPropChanged());
    this.eFilterTextField.setAutoComplete(false).onValueChange(() => this.onFilterTextChanged());
    this.addManagedListener(this.eFilterTextField.getInputElement(), 'keydown', this.onMiniFilterKeyDown.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_NEW_COLUMNS_LOADED, this.showOrHideOptions.bind(this));
    const translate = this.localeService.getLocaleTextFunc();
    this.eSelect.setInputAriaLabel(translate('ariaColumnSelectAll', 'Toggle Select All Columns'));
    this.eFilterTextField.setInputAriaLabel(translate('ariaFilterColumnsInput', 'Filter Columns Input'));
    this.activateTabIndex([this.eExpand]);
  }
  onFunctionsReadOnlyPropChanged() {
    const readOnly = this.gridOptionsService.get('functionsReadOnly');
    this.eSelect.setReadOnly(readOnly);
    this.eSelect.addOrRemoveCssClass('zing-column-select-column-readonly', readOnly);
  }
  init(params) {
    this.params = params;
    const readOnly = this.gridOptionsService.get('functionsReadOnly');
    this.eSelect.setReadOnly(readOnly);
    this.eSelect.addOrRemoveCssClass('zing-column-select-column-readonly', readOnly);
    if (this.columnModel.isReady()) {
      this.showOrHideOptions();
    }
  }
  createExpandIcons() {
    this.eExpand.appendChild(this.eExpandChecked = _.createIconNoSpan('columnSelectOpen', this.gridOptionsService));
    this.eExpand.appendChild(this.eExpandUnchecked = _.createIconNoSpan('columnSelectClosed', this.gridOptionsService));
    this.eExpand.appendChild(this.eExpandIndeterminate = _.createIconNoSpan('columnSelectIndeterminate', this.gridOptionsService));
    this.setExpandState(ExpandState.EXPANDED);
  }
  showOrHideOptions() {
    const showFilter = !this.params.suppressColumnFilter;
    const showSelect = !this.params.suppressColumnSelectAll;
    const showExpand = !this.params.suppressColumnExpandAll;
    const groupsPresent = this.columnModel.isPrimaryColumnGroupsPresent();
    const translate = this.localeService.getLocaleTextFunc();
    this.eFilterTextField.setInputPlaceholder(translate('searchOoo', 'Search...'));
    _.setDisplayed(this.eFilterTextField.getGui(), showFilter);
    _.setDisplayed(this.eSelect.getGui(), showSelect);
    _.setDisplayed(this.eExpand, showExpand && groupsPresent);
  }
  onFilterTextChanged() {
    if (!this.onFilterTextChangedDebounced) {
      this.onFilterTextChangedDebounced = _.debounce(() => {
        const filterText = this.eFilterTextField.getValue();
        this.dispatchEvent({
          type: "filterChanged",
          filterText: filterText
        });
      }, PrimaryColsHeaderPanel.DEBOUNCE_DELAY);
    }
    this.onFilterTextChangedDebounced();
  }
  onMiniFilterKeyDown(e) {
    if (e.key === KeyCode.ENTER) {
      setTimeout(() => this.onSelectClicked(), PrimaryColsHeaderPanel.DEBOUNCE_DELAY);
    }
  }
  onSelectClicked() {
    this.dispatchEvent({
      type: this.selectState ? 'unselectAll' : 'selectAll'
    });
  }
  onExpandClicked() {
    this.dispatchEvent({
      type: this.expandState === ExpandState.EXPANDED ? 'collapseAll' : 'expandAll'
    });
  }
  setExpandState(state) {
    this.expandState = state;
    _.setDisplayed(this.eExpandChecked, this.expandState === ExpandState.EXPANDED);
    _.setDisplayed(this.eExpandUnchecked, this.expandState === ExpandState.COLLAPSED);
    _.setDisplayed(this.eExpandIndeterminate, this.expandState === ExpandState.INDETERMINATE);
  }
  setSelectionState(state) {
    this.selectState = state;
    this.eSelect.setValue(this.selectState);
  }
}
PrimaryColsHeaderPanel.DEBOUNCE_DELAY = 300;
PrimaryColsHeaderPanel.TEMPLATE = `<div class="zing-column-select-header" role="presentation">
            <div ref="eExpand" class="zing-column-select-header-icon"></div>
            <zing-checkbox ref="eSelect" class="zing-column-select-header-checkbox"></zing-checkbox>
            <zing-input-text-field class="zing-column-select-header-filter-wrapper" ref="eFilterTextField"></zing-input-text-field>
        </div>`;
__decorate([Autowired('columnModel')], PrimaryColsHeaderPanel.prototype, "columnModel", void 0);
__decorate([RefSelector('eExpand')], PrimaryColsHeaderPanel.prototype, "eExpand", void 0);
__decorate([RefSelector('eSelect')], PrimaryColsHeaderPanel.prototype, "eSelect", void 0);
__decorate([RefSelector('eFilterTextField')], PrimaryColsHeaderPanel.prototype, "eFilterTextField", void 0);
__decorate([PostConstruct], PrimaryColsHeaderPanel.prototype, "postConstruct", null);
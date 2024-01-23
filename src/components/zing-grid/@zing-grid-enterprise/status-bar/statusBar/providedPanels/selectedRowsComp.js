var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Events, PostConstruct, _ } from '@/components/zing-grid/@zing-grid-community/core/main.js';
import { NameValueComp } from "./nameValueComp";
export class SelectedRowsComp extends NameValueComp {
  postConstruct() {
    if (!this.isValidRowModel()) {
      console.warn(`ZING Grid: zingSelectedRowCountComponent should only be used with the client and server side row model.`);
      return;
    }
    this.setLabel('selectedRows', 'Selected');
    this.addCssClass('zing-status-panel');
    this.addCssClass('zing-status-panel-selected-row-count');
    this.onRowSelectionChanged();
    const eventListener = this.onRowSelectionChanged.bind(this);
    this.addManagedListener(this.eventService, Events.EVENT_MODEL_UPDATED, eventListener);
    this.addManagedListener(this.eventService, Events.EVENT_SELECTION_CHANGED, eventListener);
  }
  isValidRowModel() {
    const rowModelType = this.gridApi.getModel().getType();
    return rowModelType === 'clientSide' || rowModelType === 'serverSide';
  }
  onRowSelectionChanged() {
    const selectedRowCount = this.selectionService.getSelectionCount();
    if (selectedRowCount < 0) {
      this.setValue('?');
      this.setDisplayed(true);
      return;
    }
    const localeTextFunc = this.localeService.getLocaleTextFunc();
    const thousandSeparator = localeTextFunc('thousandSeparator', ',');
    const decimalSeparator = localeTextFunc('decimalSeparator', '.');
    this.setValue(_.formatNumberCommas(selectedRowCount, thousandSeparator, decimalSeparator));
    this.setDisplayed(selectedRowCount > 0);
  }
  init() {}
  destroy() {
    super.destroy();
  }
}
__decorate([Autowired('gridApi')], SelectedRowsComp.prototype, "gridApi", void 0);
__decorate([Autowired('selectionService')], SelectedRowsComp.prototype, "selectionService", void 0);
__decorate([PostConstruct], SelectedRowsComp.prototype, "postConstruct", null);
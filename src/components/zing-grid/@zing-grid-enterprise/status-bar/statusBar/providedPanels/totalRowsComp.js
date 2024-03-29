var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Events, PostConstruct, _ } from '@/components/zing-grid/@zing-grid-community/core/main.js';
import { NameValueComp } from "./nameValueComp";
export class TotalRowsComp extends NameValueComp {
  postConstruct() {
    this.setLabel('totalRows', 'Total Rows');
    if (this.gridApi.getModel().getType() !== 'clientSide') {
      console.warn(`ZING Grid: zingTotalRowCountComponent should only be used with the client side row model.`);
      return;
    }
    this.addCssClass('zing-status-panel');
    this.addCssClass('zing-status-panel-total-row-count');
    this.setDisplayed(true);
    this.addManagedListener(this.eventService, Events.EVENT_MODEL_UPDATED, this.onDataChanged.bind(this));
    this.onDataChanged();
  }
  onDataChanged() {
    const localeTextFunc = this.localeService.getLocaleTextFunc();
    const thousandSeparator = localeTextFunc('thousandSeparator', ',');
    const decimalSeparator = localeTextFunc('decimalSeparator', '.');
    this.setValue(_.formatNumberCommas(this.getRowCountValue(), thousandSeparator, decimalSeparator));
  }
  getRowCountValue() {
    let totalRowCount = 0;
    this.gridApi.forEachLeafNode(node => totalRowCount += 1);
    return totalRowCount;
  }
  init() {}
  destroy() {
    super.destroy();
  }
}
__decorate([Autowired('gridApi')], TotalRowsComp.prototype, "gridApi", void 0);
__decorate([PostConstruct], TotalRowsComp.prototype, "postConstruct", null);
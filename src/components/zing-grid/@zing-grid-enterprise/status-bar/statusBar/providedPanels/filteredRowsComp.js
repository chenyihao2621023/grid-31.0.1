var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Events, PostConstruct, _ } from '@/components/zing-grid/@zing-grid-community/core/main.js';
import { NameValueComp } from "./nameValueComp";
export class FilteredRowsComp extends NameValueComp {
  postConstruct() {
    this.setLabel('filteredRows', 'Filtered');
    if (this.gridApi.getModel().getType() !== 'clientSide') {
      console.warn(`ZING Grid: zingFilteredRowCountComponent should only be used with the client side row model.`);
      return;
    }
    this.addCssClass('zing-status-panel');
    this.addCssClass('zing-status-panel-filtered-row-count');
    this.setDisplayed(true);
    const listener = this.onDataChanged.bind(this);
    this.addManagedListener(this.eventService, Events.EVENT_MODEL_UPDATED, listener);
    listener();
  }
  onDataChanged() {
    const totalRowCountValue = this.getTotalRowCountValue();
    const filteredRowCountValue = this.getFilteredRowCountValue();
    const localeTextFunc = this.localeService.getLocaleTextFunc();
    const thousandSeparator = localeTextFunc('thousandSeparator', ',');
    const decimalSeparator = localeTextFunc('decimalSeparator', '.');
    this.setValue(_.formatNumberCommas(filteredRowCountValue, thousandSeparator, decimalSeparator));
    this.setDisplayed(totalRowCountValue !== filteredRowCountValue);
  }
  getTotalRowCountValue() {
    let totalRowCount = 0;
    this.gridApi.forEachNode(node => totalRowCount += 1);
    return totalRowCount;
  }
  getFilteredRowCountValue() {
    let filteredRowCount = 0;
    this.gridApi.forEachNodeAfterFilter(node => {
      if (!node.group) {
        filteredRowCount += 1;
      }
    });
    return filteredRowCount;
  }
  init() {}
  destroy() {
    super.destroy();
  }
}
__decorate([Autowired('gridApi')], FilteredRowsComp.prototype, "gridApi", void 0);
__decorate([PostConstruct], FilteredRowsComp.prototype, "postConstruct", null);
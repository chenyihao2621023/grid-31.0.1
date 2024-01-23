var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BeanStub } from "../context/beanStub";
import { Autowired, Bean, PostConstruct } from "../context/context";
let RowNodeEventThrottle = class RowNodeEventThrottle extends BeanStub {
  constructor() {
    super(...arguments);
    this.events = [];
  }
  postConstruct() {
    if (this.rowModel.getType() == 'clientSide') {
      this.clientSideRowModel = this.rowModel;
    }
  }
  dispatchExpanded(event) {
    if (this.clientSideRowModel == null) {
      this.eventService.dispatchEvent(event);
      return;
    }
    this.events.push(event);
    const func = () => {
      if (this.clientSideRowModel) {
        this.clientSideRowModel.onRowGroupOpened();
      }
      this.events.forEach(e => this.eventService.dispatchEvent(e));
      this.events = [];
    };
    if (this.dispatchExpandedDebounced == null) {
      this.dispatchExpandedDebounced = this.animationFrameService.debounce(func);
    }
    this.dispatchExpandedDebounced();
  }
};
__decorate([Autowired('animationFrameService')], RowNodeEventThrottle.prototype, "animationFrameService", void 0);
__decorate([Autowired('rowModel')], RowNodeEventThrottle.prototype, "rowModel", void 0);
__decorate([PostConstruct], RowNodeEventThrottle.prototype, "postConstruct", null);
RowNodeEventThrottle = __decorate([Bean('rowNodeEventThrottle')], RowNodeEventThrottle);
export { RowNodeEventThrottle };
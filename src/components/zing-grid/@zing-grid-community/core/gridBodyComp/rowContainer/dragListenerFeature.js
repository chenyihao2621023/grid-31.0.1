var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BeanStub } from "../../context/beanStub";
import { missing } from "../../utils/generic";
import { Autowired, Optional, PostConstruct } from "../../context/context";
export class DragListenerFeature extends BeanStub {
  constructor(eContainer) {
    super();
    this.eContainer = eContainer;
  }
  postConstruct() {
    if (missing(this.rangeService)) {
      return;
    }
    this.params = {
      eElement: this.eContainer,
      onDragStart: this.rangeService.onDragStart.bind(this.rangeService),
      onDragStop: this.rangeService.onDragStop.bind(this.rangeService),
      onDragging: this.rangeService.onDragging.bind(this.rangeService)
    };
    this.addManagedPropertyListener('enableRangeSelection', props => {
      const isEnabled = props.currentValue;
      if (isEnabled) {
        this.enableFeature();
        return;
      }
      this.disableFeature();
    });
    this.addDestroyFunc(() => this.disableFeature());
    const isRangeSelection = this.gridOptionsService.get('enableRangeSelection');
    if (isRangeSelection) {
      this.enableFeature();
    }
  }
  enableFeature() {
    this.dragService.addDragSource(this.params);
  }
  disableFeature() {
    this.dragService.removeDragSource(this.params);
  }
}
__decorate([Optional('rangeService')], DragListenerFeature.prototype, "rangeService", void 0);
__decorate([Autowired('dragService')], DragListenerFeature.prototype, "dragService", void 0);
__decorate([PostConstruct], DragListenerFeature.prototype, "postConstruct", null);
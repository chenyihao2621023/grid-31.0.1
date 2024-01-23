var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BeanStub } from "../../../context/beanStub";
import { PostConstruct } from "../../../context/context";
import { ColumnGroup } from "../../../entities/columnGroup";
export class GroupWidthFeature extends BeanStub {
  constructor(comp, columnGroup) {
    super();
    this.removeChildListenersFuncs = [];
    this.columnGroup = columnGroup;
    this.comp = comp;
  }
  postConstruct() {
    this.addListenersToChildrenColumns();
    this.addManagedListener(this.columnGroup, ColumnGroup.EVENT_DISPLAYED_CHILDREN_CHANGED, this.onDisplayedChildrenChanged.bind(this));
    this.onWidthChanged();
    this.addDestroyFunc(this.removeListenersOnChildrenColumns.bind(this));
  }
  addListenersToChildrenColumns() {
    this.removeListenersOnChildrenColumns();
    const widthChangedListener = this.onWidthChanged.bind(this);
    this.columnGroup.getLeafColumns().forEach(column => {
      column.addEventListener('widthChanged', widthChangedListener);
      column.addEventListener('visibleChanged', widthChangedListener);
      this.removeChildListenersFuncs.push(() => {
        column.removeEventListener('widthChanged', widthChangedListener);
        column.removeEventListener('visibleChanged', widthChangedListener);
      });
    });
  }
  removeListenersOnChildrenColumns() {
    this.removeChildListenersFuncs.forEach(func => func());
    this.removeChildListenersFuncs = [];
  }
  onDisplayedChildrenChanged() {
    this.addListenersToChildrenColumns();
    this.onWidthChanged();
  }
  onWidthChanged() {
    const columnWidth = this.columnGroup.getActualWidth();
    this.comp.setWidth(`${columnWidth}px`);
    this.comp.addOrRemoveCssClass('zing-hidden', columnWidth === 0);
  }
}
__decorate([PostConstruct], GroupWidthFeature.prototype, "postConstruct", null);
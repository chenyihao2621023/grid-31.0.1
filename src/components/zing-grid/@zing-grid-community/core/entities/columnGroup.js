var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Column } from "./column";
import { EventService } from "../eventService";
import { Autowired } from "../context/context";
import { last } from "../utils/array";
export class ColumnGroup {
  static createUniqueId(groupId, instanceId) {
    return groupId + '_' + instanceId;
  }
  constructor(providedColumnGroup, groupId, partId, pinned) {
    this.displayedChildren = [];
    this.localEventService = new EventService();
    this.groupId = groupId;
    this.partId = partId;
    this.providedColumnGroup = providedColumnGroup;
    this.pinned = pinned;
  }
  reset() {
    this.parent = null;
    this.children = null;
    this.displayedChildren = null;
  }
  getParent() {
    return this.parent;
  }
  setParent(parent) {
    this.parent = parent;
  }
  getUniqueId() {
    return ColumnGroup.createUniqueId(this.groupId, this.partId);
  }
  isEmptyGroup() {
    return this.displayedChildren.length === 0;
  }
  isMoving() {
    const allLeafColumns = this.getProvidedColumnGroup().getLeafColumns();
    if (!allLeafColumns || allLeafColumns.length === 0) {
      return false;
    }
    return allLeafColumns.every(col => col.isMoving());
  }
  checkLeft() {
    this.displayedChildren.forEach(child => {
      if (child instanceof ColumnGroup) {
        child.checkLeft();
      }
    });
    if (this.displayedChildren.length > 0) {
      if (this.gridOptionsService.get('enableRtl')) {
        const lastChild = last(this.displayedChildren);
        const lastChildLeft = lastChild.getLeft();
        this.setLeft(lastChildLeft);
      } else {
        const firstChildLeft = this.displayedChildren[0].getLeft();
        this.setLeft(firstChildLeft);
      }
    } else {
      this.setLeft(null);
    }
  }
  getLeft() {
    return this.left;
  }
  getOldLeft() {
    return this.oldLeft;
  }
  setLeft(left) {
    this.oldLeft = left;
    if (this.left !== left) {
      this.left = left;
      this.localEventService.dispatchEvent(this.createZingEvent(ColumnGroup.EVENT_LEFT_CHANGED));
    }
  }
  getPinned() {
    return this.pinned;
  }
  createZingEvent(type) {
    return {
      type
    };
  }
  addEventListener(eventType, listener) {
    this.localEventService.addEventListener(eventType, listener);
  }
  removeEventListener(eventType, listener) {
    this.localEventService.removeEventListener(eventType, listener);
  }
  getGroupId() {
    return this.groupId;
  }
  getPartId() {
    return this.partId;
  }
  isChildInThisGroupDeepSearch(wantedChild) {
    let result = false;
    this.children.forEach(foundChild => {
      if (wantedChild === foundChild) {
        result = true;
      }
      if (foundChild instanceof ColumnGroup) {
        if (foundChild.isChildInThisGroupDeepSearch(wantedChild)) {
          result = true;
        }
      }
    });
    return result;
  }
  getActualWidth() {
    let groupActualWidth = 0;
    if (this.displayedChildren) {
      this.displayedChildren.forEach(child => {
        groupActualWidth += child.getActualWidth();
      });
    }
    return groupActualWidth;
  }
  isResizable() {
    if (!this.displayedChildren) {
      return false;
    }
    let result = false;
    this.displayedChildren.forEach(child => {
      if (child.isResizable()) {
        result = true;
      }
    });
    return result;
  }
  getMinWidth() {
    let result = 0;
    this.displayedChildren.forEach(groupChild => {
      result += groupChild.getMinWidth() || 0;
    });
    return result;
  }
  addChild(child) {
    if (!this.children) {
      this.children = [];
    }
    this.children.push(child);
  }
  getDisplayedChildren() {
    return this.displayedChildren;
  }
  getLeafColumns() {
    const result = [];
    this.addLeafColumns(result);
    return result;
  }
  getDisplayedLeafColumns() {
    const result = [];
    this.addDisplayedLeafColumns(result);
    return result;
  }
  getDefinition() {
    return this.providedColumnGroup.getColGroupDef();
  }
  getColGroupDef() {
    return this.providedColumnGroup.getColGroupDef();
  }
  isPadding() {
    return this.providedColumnGroup.isPadding();
  }
  isExpandable() {
    return this.providedColumnGroup.isExpandable();
  }
  isExpanded() {
    return this.providedColumnGroup.isExpanded();
  }
  setExpanded(expanded) {
    this.providedColumnGroup.setExpanded(expanded);
  }
  addDisplayedLeafColumns(leafColumns) {
    this.displayedChildren.forEach(child => {
      if (child instanceof Column) {
        leafColumns.push(child);
      } else if (child instanceof ColumnGroup) {
        child.addDisplayedLeafColumns(leafColumns);
      }
    });
  }
  addLeafColumns(leafColumns) {
    this.children.forEach(child => {
      if (child instanceof Column) {
        leafColumns.push(child);
      } else if (child instanceof ColumnGroup) {
        child.addLeafColumns(leafColumns);
      }
    });
  }
  getChildren() {
    return this.children;
  }
  getColumnGroupShow() {
    return this.providedColumnGroup.getColumnGroupShow();
  }
  getProvidedColumnGroup() {
    return this.providedColumnGroup;
  }
  getPaddingLevel() {
    const parent = this.getParent();
    if (!this.isPadding() || !parent || !parent.isPadding()) {
      return 0;
    }
    return 1 + parent.getPaddingLevel();
  }
  calculateDisplayedColumns() {
    this.displayedChildren = [];
    let parentWithExpansion = this;
    while (parentWithExpansion != null && parentWithExpansion.isPadding()) {
      parentWithExpansion = parentWithExpansion.getParent();
    }
    const isExpandable = parentWithExpansion ? parentWithExpansion.providedColumnGroup.isExpandable() : false;
    if (!isExpandable) {
      this.displayedChildren = this.children;
      this.localEventService.dispatchEvent(this.createZingEvent(ColumnGroup.EVENT_DISPLAYED_CHILDREN_CHANGED));
      return;
    }
    this.children.forEach(child => {
      const emptyGroup = child instanceof ColumnGroup && (!child.displayedChildren || !child.displayedChildren.length);
      if (emptyGroup) {
        return;
      }
      const headerGroupShow = child.getColumnGroupShow();
      switch (headerGroupShow) {
        case 'open':
          if (parentWithExpansion.providedColumnGroup.isExpanded()) {
            this.displayedChildren.push(child);
          }
          break;
        case 'closed':
          if (!parentWithExpansion.providedColumnGroup.isExpanded()) {
            this.displayedChildren.push(child);
          }
          break;
        default:
          this.displayedChildren.push(child);
          break;
      }
    });
    this.localEventService.dispatchEvent(this.createZingEvent(ColumnGroup.EVENT_DISPLAYED_CHILDREN_CHANGED));
  }
}
ColumnGroup.EVENT_LEFT_CHANGED = 'leftChanged';
ColumnGroup.EVENT_DISPLAYED_CHILDREN_CHANGED = 'displayedChildrenChanged';
__decorate([Autowired('gridOptionsService')], ColumnGroup.prototype, "gridOptionsService", void 0);
var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component } from "../../widgets/component";
import { Autowired, PostConstruct, PreDestroy } from "../../context/context";
import { RowNode } from "../../entities/rowNode";
import { DragSourceType } from "../../dragAndDrop/dragAndDropService";
import { Events } from "../../eventKeys";
import { BeanStub } from "../../context/beanStub";
import { createIconNoSpan } from "../../utils/icon";
import { isFunction, warnOnce } from "../../utils/function";
export class RowDragComp extends Component {
  constructor(cellValueFn, rowNode, column, customGui, dragStartPixels, suppressVisibilityChange) {
    super();
    this.cellValueFn = cellValueFn;
    this.rowNode = rowNode;
    this.column = column;
    this.customGui = customGui;
    this.dragStartPixels = dragStartPixels;
    this.suppressVisibilityChange = suppressVisibilityChange;
    this.dragSource = null;
  }
  isCustomGui() {
    return this.customGui != null;
  }
  postConstruct() {
    if (!this.customGui) {
      this.setTemplate(`<div class="zing-drag-handle zing-row-drag" aria-hidden="true"></div>`);
      this.getGui().appendChild(createIconNoSpan('rowDrag', this.gridOptionsService, null));
      this.addDragSource();
    } else {
      this.setDragElement(this.customGui, this.dragStartPixels);
    }
    this.checkCompatibility();
    if (!this.suppressVisibilityChange) {
      const strategy = this.gridOptionsService.get('rowDragManaged') ? new ManagedVisibilityStrategy(this, this.beans, this.rowNode, this.column) : new NonManagedVisibilityStrategy(this, this.beans, this.rowNode, this.column);
      this.createManagedBean(strategy, this.beans.context);
    }
  }
  setDragElement(dragElement, dragStartPixels) {
    this.setTemplateFromElement(dragElement);
    this.addDragSource(dragStartPixels);
  }
  getSelectedNodes() {
    const isRowDragMultiRow = this.gridOptionsService.get('rowDragMultiRow');
    if (!isRowDragMultiRow) {
      return [this.rowNode];
    }
    const selection = this.beans.selectionService.getSelectedNodes();
    return selection.indexOf(this.rowNode) !== -1 ? selection : [this.rowNode];
  }
  checkCompatibility() {
    const managed = this.gridOptionsService.get('rowDragManaged');
    const treeData = this.gridOptionsService.get('treeData');
    if (treeData && managed) {
      warnOnce('If using row drag with tree data, you cannot have rowDragManaged=true');
    }
  }
  getDragItem() {
    return {
      rowNode: this.rowNode,
      rowNodes: this.getSelectedNodes(),
      columns: this.column ? [this.column] : undefined,
      defaultTextValue: this.cellValueFn()
    };
  }
  getRowDragText(column) {
    if (column) {
      const colDef = column.getColDef();
      if (colDef.rowDragText) {
        return colDef.rowDragText;
      }
    }
    return this.gridOptionsService.get('rowDragText');
  }
  addDragSource(dragStartPixels = 4) {
    if (this.dragSource) {
      this.removeDragSource();
    }
    const translate = this.localeService.getLocaleTextFunc();
    this.dragSource = {
      type: DragSourceType.RowDrag,
      eElement: this.getGui(),
      dragItemName: () => {
        var _a;
        const dragItem = this.getDragItem();
        const dragItemCount = ((_a = dragItem.rowNodes) === null || _a === void 0 ? void 0 : _a.length) || 1;
        const rowDragText = this.getRowDragText(this.column);
        if (rowDragText) {
          return rowDragText(dragItem, dragItemCount);
        }
        return dragItemCount === 1 ? this.cellValueFn() : `${dragItemCount} ${translate('rowDragRows', 'rows')}`;
      },
      getDragItem: () => this.getDragItem(),
      dragStartPixels,
      dragSourceDomDataKey: this.gridOptionsService.getDomDataKey()
    };
    this.beans.dragAndDropService.addDragSource(this.dragSource, true);
  }
  removeDragSource() {
    if (this.dragSource) {
      this.beans.dragAndDropService.removeDragSource(this.dragSource);
    }
    this.dragSource = null;
  }
}
__decorate([Autowired('beans')], RowDragComp.prototype, "beans", void 0);
__decorate([PostConstruct], RowDragComp.prototype, "postConstruct", null);
__decorate([PreDestroy], RowDragComp.prototype, "removeDragSource", null);
class VisibilityStrategy extends BeanStub {
  constructor(parent, rowNode, column) {
    super();
    this.parent = parent;
    this.rowNode = rowNode;
    this.column = column;
  }
  setDisplayedOrVisible(neverDisplayed) {
    const displayedOptions = {
      skipAriaHidden: true
    };
    if (neverDisplayed) {
      this.parent.setDisplayed(false, displayedOptions);
    } else {
      let shown = true;
      let isShownSometimes = false;
      if (this.column) {
        shown = this.column.isRowDrag(this.rowNode) || this.parent.isCustomGui();
        isShownSometimes = isFunction(this.column.getColDef().rowDrag);
      }
      if (isShownSometimes) {
        this.parent.setDisplayed(true, displayedOptions);
        this.parent.setVisible(shown, displayedOptions);
      } else {
        this.parent.setDisplayed(shown, displayedOptions);
        this.parent.setVisible(true, displayedOptions);
      }
    }
  }
}
class NonManagedVisibilityStrategy extends VisibilityStrategy {
  constructor(parent, beans, rowNode, column) {
    super(parent, rowNode, column);
    this.beans = beans;
  }
  postConstruct() {
    this.addManagedPropertyListener('suppressRowDrag', this.onSuppressRowDrag.bind(this));
    this.addManagedListener(this.rowNode, RowNode.EVENT_DATA_CHANGED, this.workOutVisibility.bind(this));
    this.addManagedListener(this.rowNode, RowNode.EVENT_CELL_CHANGED, this.workOutVisibility.bind(this));
    this.addManagedListener(this.rowNode, RowNode.EVENT_CELL_CHANGED, this.workOutVisibility.bind(this));
    this.addManagedListener(this.beans.eventService, Events.EVENT_NEW_COLUMNS_LOADED, this.workOutVisibility.bind(this));
    this.workOutVisibility();
  }
  onSuppressRowDrag() {
    this.workOutVisibility();
  }
  workOutVisibility() {
    const neverDisplayed = this.gridOptionsService.get('suppressRowDrag');
    this.setDisplayedOrVisible(neverDisplayed);
  }
}
__decorate([PostConstruct], NonManagedVisibilityStrategy.prototype, "postConstruct", null);
class ManagedVisibilityStrategy extends VisibilityStrategy {
  constructor(parent, beans, rowNode, column) {
    super(parent, rowNode, column);
    this.beans = beans;
  }
  postConstruct() {
    this.addManagedListener(this.beans.eventService, Events.EVENT_SORT_CHANGED, this.workOutVisibility.bind(this));
    this.addManagedListener(this.beans.eventService, Events.EVENT_FILTER_CHANGED, this.workOutVisibility.bind(this));
    this.addManagedListener(this.beans.eventService, Events.EVENT_COLUMN_ROW_GROUP_CHANGED, this.workOutVisibility.bind(this));
    this.addManagedListener(this.beans.eventService, Events.EVENT_NEW_COLUMNS_LOADED, this.workOutVisibility.bind(this));
    this.addManagedListener(this.rowNode, RowNode.EVENT_DATA_CHANGED, this.workOutVisibility.bind(this));
    this.addManagedListener(this.rowNode, RowNode.EVENT_CELL_CHANGED, this.workOutVisibility.bind(this));
    this.addManagedPropertyListener('suppressRowDrag', this.onSuppressRowDrag.bind(this));
    this.workOutVisibility();
  }
  onSuppressRowDrag() {
    this.workOutVisibility();
  }
  workOutVisibility() {
    const gridBodyCon = this.beans.ctrlsService.getGridBodyCtrl();
    const rowDragFeature = gridBodyCon.getRowDragFeature();
    const shouldPreventRowMove = rowDragFeature && rowDragFeature.shouldPreventRowMove();
    const suppressRowDrag = this.gridOptionsService.get('suppressRowDrag');
    const hasExternalDropZones = this.beans.dragAndDropService.hasExternalDropZones();
    const neverDisplayed = shouldPreventRowMove && !hasExternalDropZones || suppressRowDrag;
    this.setDisplayedOrVisible(neverDisplayed);
  }
}
__decorate([PostConstruct], ManagedVisibilityStrategy.prototype, "postConstruct", null);
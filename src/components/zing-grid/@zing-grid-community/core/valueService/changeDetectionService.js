var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BeanStub } from "../context/beanStub";
import { Autowired, Bean, PostConstruct } from "../context/context";
import { ChangedPath } from "../utils/changedPath";
import { Events } from "../events";
const SOURCE_PASTE = 'paste';
let ChangeDetectionService = class ChangeDetectionService extends BeanStub {
  init() {
    if (this.rowModel.getType() === 'clientSide') {
      this.clientSideRowModel = this.rowModel;
    }
    this.addManagedListener(this.eventService, Events.EVENT_CELL_VALUE_CHANGED, this.onCellValueChanged.bind(this));
  }
  onCellValueChanged(event) {
    if (event.source === SOURCE_PASTE) {
      return;
    }
    this.doChangeDetection(event.node, event.column);
  }
  doChangeDetection(rowNode, column) {
    if (this.gridOptionsService.get('suppressChangeDetection')) {
      return;
    }
    const nodesToRefresh = [rowNode];
    if (this.clientSideRowModel && !rowNode.isRowPinned()) {
      const onlyChangedColumns = this.gridOptionsService.get('aggregateOnlyChangedColumns');
      const changedPath = new ChangedPath(onlyChangedColumns, this.clientSideRowModel.getRootNode());
      changedPath.addParentNode(rowNode.parent, [column]);
      this.clientSideRowModel.doAggregate(changedPath);
      changedPath.forEachChangedNodeDepthFirst(rowNode => {
        nodesToRefresh.push(rowNode);
      });
    }
    this.rowRenderer.refreshCells({
      rowNodes: nodesToRefresh
    });
  }
};
__decorate([Autowired('rowModel')], ChangeDetectionService.prototype, "rowModel", void 0);
__decorate([Autowired('rowRenderer')], ChangeDetectionService.prototype, "rowRenderer", void 0);
__decorate([PostConstruct], ChangeDetectionService.prototype, "init", null);
ChangeDetectionService = __decorate([Bean('changeDetectionService')], ChangeDetectionService);
export { ChangeDetectionService };
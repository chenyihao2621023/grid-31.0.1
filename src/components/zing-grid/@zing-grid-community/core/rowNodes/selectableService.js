var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Bean, PostConstruct } from "../context/context";
import { BeanStub } from "../context/beanStub";
import { SelectionService } from "../selectionService";
import { ChangedPath } from "../utils/changedPath";
let SelectableService = class SelectableService extends BeanStub {
  init() {
    this.addManagedPropertyListener('isRowSelectable', () => this.updateSelectable());
  }
  updateSelectableAfterGrouping() {
    this.updateSelectable(true);
  }
  updateSelectable(skipLeafNodes = false) {
    const isRowSelecting = !!this.gridOptionsService.get('rowSelection');
    const isRowSelectable = this.gridOptionsService.get('isRowSelectable');
    if (!isRowSelecting || !isRowSelectable) {
      return;
    }
    const isGroupSelectsChildren = this.gridOptionsService.get('groupSelectsChildren');
    const isCsrmGroupSelectsChildren = this.rowModel.getType() === 'clientSide' && isGroupSelectsChildren;
    const nodesToDeselect = [];
    const nodeCallback = node => {
      if (skipLeafNodes && !node.group) {
        return;
      }
      if (isCsrmGroupSelectsChildren && node.group) {
        const hasSelectableChild = node.childrenAfterGroup.some(rowNode => rowNode.selectable === true);
        node.setRowSelectable(hasSelectableChild, true);
        return;
      }
      const rowSelectable = isRowSelectable ? isRowSelectable(node) : true;
      node.setRowSelectable(rowSelectable, true);
      if (!rowSelectable && node.isSelected()) {
        nodesToDeselect.push(node);
      }
    };
    if (isCsrmGroupSelectsChildren) {
      const csrm = this.rowModel;
      const changedPath = new ChangedPath(false, csrm.getRootNode());
      changedPath.forEachChangedNodeDepthFirst(nodeCallback, true, true);
    } else {
      this.rowModel.forEachNode(nodeCallback);
    }
    if (nodesToDeselect.length) {
      this.selectionService.setNodesSelected({
        nodes: nodesToDeselect,
        newValue: false,
        source: 'selectableChanged'
      });
    }
    if (isCsrmGroupSelectsChildren && this.selectionService instanceof SelectionService) {
      this.selectionService.updateGroupsFromChildrenSelections('selectableChanged');
    }
  }
};
__decorate([Autowired('rowModel')], SelectableService.prototype, "rowModel", void 0);
__decorate([Autowired('selectionService')], SelectableService.prototype, "selectionService", void 0);
__decorate([PostConstruct], SelectableService.prototype, "init", null);
SelectableService = __decorate([Bean('selectableService')], SelectableService);
export { SelectableService };
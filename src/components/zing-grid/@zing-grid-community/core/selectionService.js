var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = this && this.__param || function (paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
};
import { Bean } from "./context/context";
import { BeanStub } from "./context/beanStub";
import { Qualifier } from "./context/context";
import { Events } from "./events";
import { Autowired } from "./context/context";
import { PostConstruct } from "./context/context";
import { ChangedPath } from "./utils/changedPath";
import { exists, missing } from "./utils/generic";
import { last } from "./utils/array";
let SelectionService = class SelectionService extends BeanStub {
  constructor() {
    super(...arguments);
    this.selectedNodes = new Map();
  }
  setBeans(loggerFactory) {
    this.logger = loggerFactory.create('selectionService');
    this.resetNodes();
  }
  init() {
    this.rowSelection = this.gridOptionsService.get('rowSelection');
    this.groupSelectsChildren = this.gridOptionsService.get('groupSelectsChildren');
    this.addManagedPropertyListeners(['groupSelectsChildren', 'rowSelection'], () => {
      this.groupSelectsChildren = this.gridOptionsService.get('groupSelectsChildren');
      this.rowSelection = this.gridOptionsService.get('rowSelection');
      this.deselectAllRowNodes({
        source: 'api'
      });
    });
    this.addManagedListener(this.eventService, Events.EVENT_ROW_SELECTED, this.onRowSelected.bind(this));
  }
  isMultiselect() {
    return this.rowSelection === 'multiple';
  }
  setNodesSelected(params) {
    var _a;
    if (params.nodes.length === 0) return 0;
    const {
      newValue,
      clearSelection,
      suppressFinishActions,
      rangeSelect,
      event,
      source = 'api'
    } = params;
    if (params.nodes.length > 1 && !this.isMultiselect()) {
      console.warn(`ZING Grid: cannot multi select while rowSelection='single'`);
      return 0;
    }
    const groupSelectsFiltered = this.groupSelectsChildren && params.groupSelectsFiltered === true;
    const nodes = params.nodes.map(node => node.footer ? node.sibling : node);
    if (rangeSelect) {
      if (params.nodes.length > 1) {
        console.warn('ZING Grid: cannot range select while selecting multiple rows');
        return 0;
      }
      const lastSelectedNode = this.getLastSelectedNode();
      if (lastSelectedNode) {
        const node = nodes[0];
        const newRowClicked = lastSelectedNode !== node;
        if (newRowClicked && this.isMultiselect()) {
          return this.selectRange(node, lastSelectedNode, params.newValue, source);
          ;
        }
      }
    }
    let updatedCount = 0;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const skipThisNode = groupSelectsFiltered && node.group;
      if (!skipThisNode) {
        const thisNodeWasSelected = node.selectThisNode(newValue, params.event, source);
        if (thisNodeWasSelected) {
          updatedCount++;
        }
      }
      if (this.groupSelectsChildren && ((_a = node.childrenAfterGroup) === null || _a === void 0 ? void 0 : _a.length)) {
        updatedCount += this.selectChildren(node, newValue, groupSelectsFiltered, source);
      }
    }
    if (!suppressFinishActions) {
      const clearOtherNodes = newValue && (clearSelection || !this.isMultiselect());
      if (clearOtherNodes) {
        updatedCount += this.clearOtherNodes(nodes[0], source);
      }
      if (updatedCount > 0) {
        this.updateGroupsFromChildrenSelections(source);
        const event = {
          type: Events.EVENT_SELECTION_CHANGED,
          source
        };
        this.eventService.dispatchEvent(event);
      }
    }
    return updatedCount;
  }
  selectRange(fromNode, toNode, value = true, source) {
    const nodesToSelect = this.rowModel.getNodesInRangeForSelection(fromNode, toNode);
    let updatedCount = 0;
    nodesToSelect.forEach(rowNode => {
      if (rowNode.group && this.groupSelectsChildren || value === false && fromNode === rowNode) {
        return;
      }
      const nodeWasSelected = rowNode.selectThisNode(value, undefined, source);
      if (nodeWasSelected) {
        updatedCount++;
      }
    });
    this.updateGroupsFromChildrenSelections(source);
    const event = {
      type: Events.EVENT_SELECTION_CHANGED,
      source
    };
    this.eventService.dispatchEvent(event);
    return updatedCount;
  }
  selectChildren(node, newValue, groupSelectsFiltered, source) {
    const children = groupSelectsFiltered ? node.childrenAfterAggFilter : node.childrenAfterGroup;
    if (missing(children)) {
      return 0;
    }
    return this.setNodesSelected({
      newValue: newValue,
      clearSelection: false,
      suppressFinishActions: true,
      groupSelectsFiltered,
      source,
      nodes: children
    });
  }
  getLastSelectedNode() {
    const selectedKeys = Array.from(this.selectedNodes.keys());
    if (selectedKeys.length == 0) {
      return null;
    }
    const node = this.selectedNodes.get(last(selectedKeys));
    if (node) {
      return node;
    }
    return null;
  }
  getSelectedNodes() {
    const selectedNodes = [];
    this.selectedNodes.forEach(rowNode => {
      if (rowNode) {
        selectedNodes.push(rowNode);
      }
    });
    return selectedNodes;
  }
  getSelectedRows() {
    const selectedRows = [];
    this.selectedNodes.forEach(rowNode => {
      if (rowNode && rowNode.data) {
        selectedRows.push(rowNode.data);
      }
    });
    return selectedRows;
  }
  getSelectionCount() {
    return this.selectedNodes.size;
  }
  filterFromSelection(predicate) {
    const newSelectedNodes = new Map();
    this.selectedNodes.forEach((rowNode, key) => {
      const passesPredicate = rowNode && predicate(rowNode);
      if (passesPredicate) {
        newSelectedNodes.set(key, rowNode);
      }
    });
    this.selectedNodes = newSelectedNodes;
  }
  updateGroupsFromChildrenSelections(source, changedPath) {
    if (!this.groupSelectsChildren) {
      return false;
    }
    if (this.rowModel.getType() !== 'clientSide') {
      return false;
    }
    const clientSideRowModel = this.rowModel;
    const rootNode = clientSideRowModel.getRootNode();
    if (!changedPath) {
      changedPath = new ChangedPath(true, rootNode);
      changedPath.setInactive();
    }
    let selectionChanged = false;
    changedPath.forEachChangedNodeDepthFirst(rowNode => {
      if (rowNode !== rootNode) {
        const selected = rowNode.calculateSelectedFromChildren();
        selectionChanged = rowNode.selectThisNode(selected === null ? false : selected, undefined, source) || selectionChanged;
      }
    });
    return selectionChanged;
  }
  clearOtherNodes(rowNodeToKeepSelected, source) {
    const groupsToRefresh = new Map();
    let updatedCount = 0;
    this.selectedNodes.forEach(otherRowNode => {
      if (otherRowNode && otherRowNode.id !== rowNodeToKeepSelected.id) {
        const rowNode = this.selectedNodes.get(otherRowNode.id);
        updatedCount += rowNode.setSelectedParams({
          newValue: false,
          clearSelection: false,
          suppressFinishActions: true,
          source
        });
        if (this.groupSelectsChildren && otherRowNode.parent) {
          groupsToRefresh.set(otherRowNode.parent.id, otherRowNode.parent);
        }
      }
    });
    groupsToRefresh.forEach(group => {
      const selected = group.calculateSelectedFromChildren();
      group.selectThisNode(selected === null ? false : selected, undefined, source);
    });
    return updatedCount;
  }
  onRowSelected(event) {
    const rowNode = event.node;
    if (this.groupSelectsChildren && rowNode.group) {
      return;
    }
    if (rowNode.isSelected()) {
      this.selectedNodes.set(rowNode.id, rowNode);
    } else {
      this.selectedNodes.delete(rowNode.id);
    }
  }
  syncInRowNode(rowNode, oldNode) {
    this.syncInOldRowNode(rowNode, oldNode);
    this.syncInNewRowNode(rowNode);
  }
  syncInOldRowNode(rowNode, oldNode) {
    const oldNodeHasDifferentId = exists(oldNode) && rowNode.id !== oldNode.id;
    if (oldNodeHasDifferentId && oldNode) {
      const id = oldNode.id;
      const oldNodeSelected = this.selectedNodes.get(id) == rowNode;
      if (oldNodeSelected) {
        this.selectedNodes.set(oldNode.id, oldNode);
      }
    }
  }
  syncInNewRowNode(rowNode) {
    if (this.selectedNodes.has(rowNode.id)) {
      rowNode.setSelectedInitialValue(true);
      this.selectedNodes.set(rowNode.id, rowNode);
    } else {
      rowNode.setSelectedInitialValue(false);
    }
  }
  reset(source) {
    const selectionCount = this.getSelectionCount();
    this.resetNodes();
    if (selectionCount) {
      const event = {
        type: Events.EVENT_SELECTION_CHANGED,
        source
      };
      this.eventService.dispatchEvent(event);
    }
  }
  resetNodes() {
    var _a;
    this.logger.log('reset');
    (_a = this.selectedNodes) === null || _a === void 0 ? void 0 : _a.clear();
  }
  getBestCostNodeSelection() {
    if (this.rowModel.getType() !== 'clientSide') {
      return;
    }
    const clientSideRowModel = this.rowModel;
    const topLevelNodes = clientSideRowModel.getTopLevelNodes();
    if (topLevelNodes === null) {
      return;
    }
    const result = [];
    function traverse(nodes) {
      for (let i = 0, l = nodes.length; i < l; i++) {
        const node = nodes[i];
        if (node.isSelected()) {
          result.push(node);
        } else {
          const maybeGroup = node;
          if (maybeGroup.group && maybeGroup.children) {
            traverse(maybeGroup.children);
          }
        }
      }
    }
    traverse(topLevelNodes);
    return result;
  }
  isEmpty() {
    let count = 0;
    this.selectedNodes.forEach(rowNode => {
      if (rowNode) {
        count++;
      }
    });
    return count === 0;
  }
  deselectAllRowNodes(params) {
    const callback = rowNode => rowNode.selectThisNode(false, undefined, source);
    const rowModelClientSide = this.rowModel.getType() === 'clientSide';
    const {
      source,
      justFiltered,
      justCurrentPage
    } = params;
    if (justCurrentPage || justFiltered) {
      if (!rowModelClientSide) {
        console.error("ZING Grid: selecting just filtered only works when gridOptions.rowModelType='clientSide'");
        return;
      }
      this.getNodesToSelect(justFiltered, justCurrentPage).forEach(callback);
    } else {
      this.selectedNodes.forEach(rowNode => {
        if (rowNode) {
          callback(rowNode);
        }
      });
      this.reset(source);
    }
    if (rowModelClientSide && this.groupSelectsChildren) {
      this.updateGroupsFromChildrenSelections(source);
    }
    const event = {
      type: Events.EVENT_SELECTION_CHANGED,
      source
    };
    this.eventService.dispatchEvent(event);
  }
  getSelectedCounts(justFiltered, justCurrentPage) {
    let selectedCount = 0;
    let notSelectedCount = 0;
    const callback = node => {
      if (this.groupSelectsChildren && node.group) {
        return;
      }
      if (node.isSelected()) {
        selectedCount++;
      } else if (!node.selectable) {} else {
        notSelectedCount++;
      }
    };
    this.getNodesToSelect(justFiltered, justCurrentPage).forEach(callback);
    return {
      selectedCount,
      notSelectedCount
    };
  }
  getSelectAllState(justFiltered, justCurrentPage) {
    const {
      selectedCount,
      notSelectedCount
    } = this.getSelectedCounts(justFiltered, justCurrentPage);
    if (selectedCount === 0 && notSelectedCount === 0) {
      return false;
    }
    if (selectedCount > 0 && notSelectedCount > 0) {
      return null;
    }
    return selectedCount > 0;
  }
  getNodesToSelect(justFiltered = false, justCurrentPage = false) {
    if (this.rowModel.getType() !== 'clientSide') {
      throw new Error(`selectAll only available when rowModelType='clientSide', ie not ${this.rowModel.getType()}`);
    }
    const nodes = [];
    if (justCurrentPage) {
      this.paginationProxy.forEachNodeOnPage(node => {
        if (!node.group) {
          nodes.push(node);
          return;
        }
        if (!node.expanded) {
          const recursivelyAddChildren = child => {
            var _a;
            nodes.push(child);
            if ((_a = child.childrenAfterFilter) === null || _a === void 0 ? void 0 : _a.length) {
              child.childrenAfterFilter.forEach(recursivelyAddChildren);
            }
          };
          recursivelyAddChildren(node);
          return;
        }
        if (!this.groupSelectsChildren) {
          nodes.push(node);
        }
      });
      return nodes;
    }
    const clientSideRowModel = this.rowModel;
    if (justFiltered) {
      clientSideRowModel.forEachNodeAfterFilter(node => {
        nodes.push(node);
      });
      return nodes;
    }
    clientSideRowModel.forEachNode(node => {
      nodes.push(node);
    });
    return nodes;
  }
  selectAllRowNodes(params) {
    if (this.rowModel.getType() !== 'clientSide') {
      throw new Error(`selectAll only available when rowModelType='clientSide', ie not ${this.rowModel.getType()}`);
    }
    const {
      source,
      justFiltered,
      justCurrentPage
    } = params;
    const callback = rowNode => rowNode.selectThisNode(true, undefined, source);
    this.getNodesToSelect(justFiltered, justCurrentPage).forEach(callback);
    if (this.rowModel.getType() === 'clientSide' && this.groupSelectsChildren) {
      this.updateGroupsFromChildrenSelections(source);
    }
    const event = {
      type: Events.EVENT_SELECTION_CHANGED,
      source
    };
    this.eventService.dispatchEvent(event);
  }
  getSelectionState() {
    const selectedIds = [];
    this.selectedNodes.forEach(node => {
      if (node === null || node === void 0 ? void 0 : node.id) {
        selectedIds.push(node.id);
      }
    });
    return selectedIds.length ? selectedIds : null;
  }
  setSelectionState(state, source) {
    if (!Array.isArray(state)) {
      return;
    }
    const rowIds = new Set(state);
    const nodes = [];
    this.rowModel.forEachNode(node => {
      if (rowIds.has(node.id)) {
        nodes.push(node);
      }
    });
    this.setNodesSelected({
      newValue: true,
      nodes,
      source
    });
  }
};
__decorate([Autowired('rowModel')], SelectionService.prototype, "rowModel", void 0);
__decorate([Autowired('paginationProxy')], SelectionService.prototype, "paginationProxy", void 0);
__decorate([__param(0, Qualifier('loggerFactory'))], SelectionService.prototype, "setBeans", null);
__decorate([PostConstruct], SelectionService.prototype, "init", null);
SelectionService = __decorate([Bean('selectionService')], SelectionService);
export { SelectionService };
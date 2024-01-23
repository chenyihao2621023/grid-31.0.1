var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, Autowired, Bean, BeanStub } from "@/components/zing-grid/@zing-grid-community/core/main.js";
let SortService = class SortService extends BeanStub {
  sort(sortOptions, sortActive, useDeltaSort, rowNodeTransactions, changedPath, sortContainsGroupColumns) {
    const groupMaintainOrder = this.gridOptionsService.get('groupMaintainOrder');
    const groupColumnsPresent = this.columnModel.getAllGridColumns().some(c => c.isRowGroupActive());
    let allDirtyNodes = {};
    if (useDeltaSort && rowNodeTransactions) {
      allDirtyNodes = this.calculateDirtyNodes(rowNodeTransactions);
    }
    const isPivotMode = this.columnModel.isPivotMode();
    const postSortFunc = this.gridOptionsService.getCallback('postSortRows');
    const callback = rowNode => {
      this.pullDownGroupDataForHideOpenParents(rowNode.childrenAfterAggFilter, true);
      const skipSortingPivotLeafs = isPivotMode && rowNode.leafGroup;
      let skipSortingGroups = groupMaintainOrder && groupColumnsPresent && !rowNode.leafGroup && !sortContainsGroupColumns;
      if (skipSortingGroups) {
        const childrenToBeSorted = rowNode.childrenAfterAggFilter.slice(0);
        if (rowNode.childrenAfterSort) {
          const indexedOrders = {};
          rowNode.childrenAfterSort.forEach((node, idx) => {
            indexedOrders[node.id] = idx;
          });
          childrenToBeSorted.sort((row1, row2) => {
            var _a, _b;
            return ((_a = indexedOrders[row1.id]) !== null && _a !== void 0 ? _a : 0) - ((_b = indexedOrders[row2.id]) !== null && _b !== void 0 ? _b : 0);
          });
        }
        rowNode.childrenAfterSort = childrenToBeSorted;
      } else if (!sortActive || skipSortingPivotLeafs) {
        rowNode.childrenAfterSort = rowNode.childrenAfterAggFilter.slice(0);
      } else if (useDeltaSort) {
        rowNode.childrenAfterSort = this.doDeltaSort(rowNode, allDirtyNodes, changedPath, sortOptions);
      } else {
        rowNode.childrenAfterSort = this.rowNodeSorter.doFullSort(rowNode.childrenAfterAggFilter, sortOptions);
      }
      if (rowNode.sibling) {
        rowNode.sibling.childrenAfterSort = rowNode.childrenAfterSort;
      }
      this.updateChildIndexes(rowNode);
      if (postSortFunc) {
        const params = {
          nodes: rowNode.childrenAfterSort
        };
        postSortFunc(params);
      }
    };
    if (changedPath) {
      changedPath.forEachChangedNodeDepthFirst(callback);
    }
    this.updateGroupDataForHideOpenParents(changedPath);
  }
  calculateDirtyNodes(rowNodeTransactions) {
    const dirtyNodes = {};
    const addNodesFunc = rowNodes => {
      if (rowNodes) {
        rowNodes.forEach(rowNode => dirtyNodes[rowNode.id] = true);
      }
    };
    if (rowNodeTransactions) {
      rowNodeTransactions.forEach(tran => {
        addNodesFunc(tran.add);
        addNodesFunc(tran.update);
        addNodesFunc(tran.remove);
      });
    }
    return dirtyNodes;
  }
  doDeltaSort(rowNode, allTouchedNodes, changedPath, sortOptions) {
    const unsortedRows = rowNode.childrenAfterAggFilter;
    const oldSortedRows = rowNode.childrenAfterSort;
    if (!oldSortedRows) {
      return this.rowNodeSorter.doFullSort(unsortedRows, sortOptions);
    }
    const untouchedRowsMap = {};
    const touchedRows = [];
    unsortedRows.forEach(row => {
      if (allTouchedNodes[row.id] || !changedPath.canSkip(row)) {
        touchedRows.push(row);
      } else {
        untouchedRowsMap[row.id] = true;
      }
    });
    const sortedUntouchedRows = oldSortedRows.filter(child => untouchedRowsMap[child.id]);
    const mapNodeToSortedNode = (rowNode, pos) => ({
      currentPos: pos,
      rowNode: rowNode
    });
    const sortedChangedRows = touchedRows.map(mapNodeToSortedNode).sort((a, b) => this.rowNodeSorter.compareRowNodes(sortOptions, a, b));
    return this.mergeSortedArrays(sortOptions, sortedChangedRows, sortedUntouchedRows.map(mapNodeToSortedNode)).map(({
      rowNode
    }) => rowNode);
  }
  mergeSortedArrays(sortOptions, arr1, arr2) {
    const res = [];
    let i = 0;
    let j = 0;
    while (i < arr1.length && j < arr2.length) {
      const compareResult = this.rowNodeSorter.compareRowNodes(sortOptions, arr1[i], arr2[j]);
      if (compareResult < 0) {
        res.push(arr1[i++]);
      } else {
        res.push(arr2[j++]);
      }
    }
    while (i < arr1.length) {
      res.push(arr1[i++]);
    }
    while (j < arr2.length) {
      res.push(arr2[j++]);
    }
    return res;
  }
  updateChildIndexes(rowNode) {
    if (_.missing(rowNode.childrenAfterSort)) {
      return;
    }
    const listToSort = rowNode.childrenAfterSort;
    for (let i = 0; i < listToSort.length; i++) {
      const child = listToSort[i];
      const firstChild = i === 0;
      const lastChild = i === rowNode.childrenAfterSort.length - 1;
      child.setFirstChild(firstChild);
      child.setLastChild(lastChild);
      child.setChildIndex(i);
    }
  }
  updateGroupDataForHideOpenParents(changedPath) {
    if (!this.gridOptionsService.get('groupHideOpenParents')) {
      return;
    }
    if (this.gridOptionsService.get('treeData')) {
      _.warnOnce(`The property hideOpenParents dose not work with Tree Data. This is because Tree Data has values at the group level, it doesn't make sense to hide them.`);
      return false;
    }
    const callback = rowNode => {
      this.pullDownGroupDataForHideOpenParents(rowNode.childrenAfterSort, false);
      rowNode.childrenAfterSort.forEach(child => {
        if (child.hasChildren()) {
          callback(child);
        }
      });
    };
    if (changedPath) {
      changedPath.executeFromRootNode(rowNode => callback(rowNode));
    }
  }
  pullDownGroupDataForHideOpenParents(rowNodes, clearOperation) {
    if (!this.gridOptionsService.get('groupHideOpenParents') || _.missing(rowNodes)) {
      return;
    }
    rowNodes.forEach(childRowNode => {
      const groupDisplayCols = this.columnModel.getGroupDisplayColumns();
      groupDisplayCols.forEach(groupDisplayCol => {
        const showRowGroup = groupDisplayCol.getColDef().showRowGroup;
        if (typeof showRowGroup !== 'string') {
          console.error('ZING Grid: groupHideOpenParents only works when specifying specific columns for colDef.showRowGroup');
          return;
        }
        const displayingGroupKey = showRowGroup;
        const rowGroupColumn = this.columnModel.getPrimaryColumn(displayingGroupKey);
        const thisRowNodeMatches = rowGroupColumn === childRowNode.rowGroupColumn;
        if (thisRowNodeMatches) {
          return;
        }
        if (clearOperation) {
          childRowNode.setGroupValue(groupDisplayCol.getId(), undefined);
        } else {
          const parentToStealFrom = childRowNode.getFirstChildOfFirstChild(rowGroupColumn);
          if (parentToStealFrom) {
            childRowNode.setGroupValue(groupDisplayCol.getId(), parentToStealFrom.key);
          }
        }
      });
    });
  }
};
__decorate([Autowired('columnModel')], SortService.prototype, "columnModel", void 0);
__decorate([Autowired('rowNodeSorter')], SortService.prototype, "rowNodeSorter", void 0);
SortService = __decorate([Bean('sortService')], SortService);
export { SortService };
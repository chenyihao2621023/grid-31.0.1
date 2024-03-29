var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, Autowired, Bean, BeanStub, ColumnGroup, GROUP_AUTO_COLUMN_ID, GroupInstanceIdCreator } from "@/components/zing-grid/@zing-grid-community/core/main.js";
export var RowType;
(function (RowType) {
  RowType[RowType["HEADER_GROUPING"] = 0] = "HEADER_GROUPING";
  RowType[RowType["HEADER"] = 1] = "HEADER";
  RowType[RowType["BODY"] = 2] = "BODY";
})(RowType || (RowType = {}));
let GridSerializer = class GridSerializer extends BeanStub {
  serialize(gridSerializingSession, params = {}) {
    const {
      allColumns,
      columnKeys,
      skipRowGroups
    } = params;
    const columnsToExport = this.getColumnsToExport(allColumns, skipRowGroups, columnKeys);
    const serializeChain = _.compose(this.prepareSession(columnsToExport), this.prependContent(params), this.exportColumnGroups(params, columnsToExport), this.exportHeaders(params, columnsToExport), this.processPinnedTopRows(params, columnsToExport), this.processRows(params, columnsToExport), this.processPinnedBottomRows(params, columnsToExport), this.appendContent(params));
    return serializeChain(gridSerializingSession).parse();
  }
  processRow(gridSerializingSession, params, columnsToExport, node) {
    const rowSkipper = params.shouldRowBeSkipped || (() => false);
    const context = this.gridOptionsService.context;
    const api = this.gridOptionsService.api;
    const columnApi = this.gridOptionsService.columnApi;
    const skipSingleChildrenGroup = this.gridOptionsService.get('groupRemoveSingleChildren');
    const skipLowestSingleChildrenGroup = this.gridOptionsService.get('groupRemoveLowestSingleChildren');
    const isClipboardExport = params.rowPositions != null;
    const isExplicitExportSelection = isClipboardExport || !!params.onlySelected;
    const hideOpenParents = this.gridOptionsService.get('groupHideOpenParents') && !isExplicitExportSelection;
    const isLeafNode = this.columnModel.isPivotMode() ? node.leafGroup : !node.group;
    const isFooter = !!node.footer;
    const skipRowGroups = params.skipRowGroups;
    const shouldSkipLowestGroup = skipLowestSingleChildrenGroup && node.leafGroup;
    const shouldSkipCurrentGroup = node.allChildrenCount === 1 && (skipSingleChildrenGroup || shouldSkipLowestGroup);
    if (!isLeafNode && !isFooter && (params.skipRowGroups || shouldSkipCurrentGroup || hideOpenParents) || params.onlySelected && !node.isSelected() || params.skipPinnedTop && node.rowPinned === 'top' || params.skipPinnedBottom && node.rowPinned === 'bottom') {
      return;
    }
    const nodeIsRootNode = node.level === -1;
    if (nodeIsRootNode && !isLeafNode && !isFooter) {
      return;
    }
    const shouldRowBeSkipped = rowSkipper({
      node,
      api,
      columnApi,
      context
    });
    if (shouldRowBeSkipped) {
      return;
    }
    const rowAccumulator = gridSerializingSession.onNewBodyRow(node);
    columnsToExport.forEach((column, index) => {
      rowAccumulator.onColumn(column, index, node);
    });
    if (params.getCustomContentBelowRow) {
      const content = params.getCustomContentBelowRow({
        node,
        api,
        columnApi,
        context
      });
      if (content) {
        gridSerializingSession.addCustomContent(content);
      }
    }
  }
  appendContent(params) {
    return gridSerializingSession => {
      const appendContent = params.appendContent;
      if (appendContent) {
        gridSerializingSession.addCustomContent(appendContent);
      }
      return gridSerializingSession;
    };
  }
  prependContent(params) {
    return gridSerializingSession => {
      const prependContent = params.prependContent;
      if (prependContent) {
        gridSerializingSession.addCustomContent(prependContent);
      }
      return gridSerializingSession;
    };
  }
  prepareSession(columnsToExport) {
    return gridSerializingSession => {
      gridSerializingSession.prepare(columnsToExport);
      return gridSerializingSession;
    };
  }
  exportColumnGroups(params, columnsToExport) {
    return gridSerializingSession => {
      if (!params.skipColumnGroupHeaders) {
        const groupInstanceIdCreator = new GroupInstanceIdCreator();
        const displayedGroups = this.displayedGroupCreator.createDisplayedGroups(columnsToExport, groupInstanceIdCreator, null);
        this.recursivelyAddHeaderGroups(displayedGroups, gridSerializingSession, params.processGroupHeaderCallback);
      }
      return gridSerializingSession;
    };
  }
  exportHeaders(params, columnsToExport) {
    return gridSerializingSession => {
      if (!params.skipColumnHeaders) {
        const gridRowIterator = gridSerializingSession.onNewHeaderRow();
        columnsToExport.forEach((column, index) => {
          gridRowIterator.onColumn(column, index, undefined);
        });
      }
      return gridSerializingSession;
    };
  }
  processPinnedTopRows(params, columnsToExport) {
    return gridSerializingSession => {
      const processRow = this.processRow.bind(this, gridSerializingSession, params, columnsToExport);
      if (params.rowPositions) {
        params.rowPositions.filter(position => position.rowPinned === 'top').sort((a, b) => a.rowIndex - b.rowIndex).map(position => this.pinnedRowModel.getPinnedTopRow(position.rowIndex)).forEach(processRow);
      } else {
        this.pinnedRowModel.forEachPinnedTopRow(processRow);
      }
      return gridSerializingSession;
    };
  }
  processRows(params, columnsToExport) {
    return gridSerializingSession => {
      const rowModel = this.rowModel;
      const rowModelType = rowModel.getType();
      const usingCsrm = rowModelType === 'clientSide';
      const usingSsrm = rowModelType === 'serverSide';
      const onlySelectedNonStandardModel = !usingCsrm && params.onlySelected;
      const processRow = this.processRow.bind(this, gridSerializingSession, params, columnsToExport);
      const {
        exportedRows = 'filteredAndSorted'
      } = params;
      if (params.rowPositions) {
        params.rowPositions.filter(position => position.rowPinned == null).sort((a, b) => a.rowIndex - b.rowIndex).map(position => rowModel.getRow(position.rowIndex)).forEach(processRow);
      } else if (this.columnModel.isPivotMode()) {
        if (usingCsrm) {
          rowModel.forEachPivotNode(processRow, true);
        } else if (usingSsrm) {
          rowModel.forEachNodeAfterFilterAndSort(processRow, true);
        } else {
          rowModel.forEachNode(processRow);
        }
      } else {
        if (params.onlySelectedAllPages || onlySelectedNonStandardModel) {
          const selectedNodes = this.selectionService.getSelectedNodes();
          this.replicateSortedOrder(selectedNodes);
          selectedNodes.forEach(processRow);
        } else {
          if (exportedRows === 'all') {
            rowModel.forEachNode(processRow);
          } else if (usingCsrm) {
            rowModel.forEachNodeAfterFilterAndSort(processRow, true);
          } else if (usingSsrm) {
            rowModel.forEachNodeAfterFilterAndSort(processRow, true);
          } else {
            rowModel.forEachNode(processRow);
          }
        }
      }
      return gridSerializingSession;
    };
  }
  replicateSortedOrder(rows) {
    const sortOptions = this.sortController.getSortOptions();
    const compareNodes = (rowA, rowB) => {
      var _a, _b, _c, _d;
      if (rowA.rowIndex != null && rowB.rowIndex != null) {
        return rowA.rowIndex - rowB.rowIndex;
      }
      if (rowA.level === rowB.level) {
        if (((_a = rowA.parent) === null || _a === void 0 ? void 0 : _a.id) === ((_b = rowB.parent) === null || _b === void 0 ? void 0 : _b.id)) {
          return this.rowNodeSorter.compareRowNodes(sortOptions, {
            rowNode: rowA,
            currentPos: (_c = rowA.rowIndex) !== null && _c !== void 0 ? _c : -1
          }, {
            rowNode: rowB,
            currentPos: (_d = rowB.rowIndex) !== null && _d !== void 0 ? _d : -1
          });
        }
        return compareNodes(rowA.parent, rowB.parent);
      }
      if (rowA.level > rowB.level) {
        return compareNodes(rowA.parent, rowB);
      }
      return compareNodes(rowA, rowB.parent);
    };
    rows.sort(compareNodes);
  }
  processPinnedBottomRows(params, columnsToExport) {
    return gridSerializingSession => {
      const processRow = this.processRow.bind(this, gridSerializingSession, params, columnsToExport);
      if (params.rowPositions) {
        params.rowPositions.filter(position => position.rowPinned === 'bottom').sort((a, b) => a.rowIndex - b.rowIndex).map(position => this.pinnedRowModel.getPinnedBottomRow(position.rowIndex)).forEach(processRow);
      } else {
        this.pinnedRowModel.forEachPinnedBottomRow(processRow);
      }
      return gridSerializingSession;
    };
  }
  getColumnsToExport(allColumns = false, skipRowGroups = false, columnKeys) {
    const isPivotMode = this.columnModel.isPivotMode();
    if (columnKeys && columnKeys.length) {
      return this.columnModel.getGridColumns(columnKeys);
    }
    const isTreeData = this.gridOptionsService.get('treeData');
    let columnsToExport = [];
    if (allColumns && !isPivotMode) {
      const columns = isTreeData ? this.columnModel.getGridColumns([GROUP_AUTO_COLUMN_ID]) : [];
      columnsToExport = columns.concat(this.columnModel.getAllGridColumns());
    } else {
      columnsToExport = this.columnModel.getAllDisplayedColumns();
    }
    if (skipRowGroups && !isTreeData) {
      columnsToExport = columnsToExport.filter(column => column.getColId() !== GROUP_AUTO_COLUMN_ID);
    }
    return columnsToExport;
  }
  recursivelyAddHeaderGroups(displayedGroups, gridSerializingSession, processGroupHeaderCallback) {
    const directChildrenHeaderGroups = [];
    displayedGroups.forEach(columnGroupChild => {
      const columnGroup = columnGroupChild;
      if (!columnGroup.getChildren) {
        return;
      }
      columnGroup.getChildren().forEach(it => directChildrenHeaderGroups.push(it));
    });
    if (displayedGroups.length > 0 && displayedGroups[0] instanceof ColumnGroup) {
      this.doAddHeaderHeader(gridSerializingSession, displayedGroups, processGroupHeaderCallback);
    }
    if (directChildrenHeaderGroups && directChildrenHeaderGroups.length > 0) {
      this.recursivelyAddHeaderGroups(directChildrenHeaderGroups, gridSerializingSession, processGroupHeaderCallback);
    }
  }
  doAddHeaderHeader(gridSerializingSession, displayedGroups, processGroupHeaderCallback) {
    const gridRowIterator = gridSerializingSession.onNewHeaderGroupingRow();
    let columnIndex = 0;
    displayedGroups.forEach(columnGroupChild => {
      const columnGroup = columnGroupChild;
      let name;
      if (processGroupHeaderCallback) {
        name = processGroupHeaderCallback({
          columnGroup: columnGroup,
          api: this.gridOptionsService.api,
          columnApi: this.gridOptionsService.columnApi,
          context: this.gridOptionsService.context
        });
      } else {
        name = this.columnModel.getDisplayNameForColumnGroup(columnGroup, 'header');
      }
      const collapsibleGroupRanges = columnGroup.getLeafColumns().reduce((collapsibleGroups, currentColumn, currentIdx, arr) => {
        let lastGroup = _.last(collapsibleGroups);
        const groupShow = currentColumn.getColumnGroupShow() === 'open';
        if (!groupShow) {
          if (lastGroup && lastGroup[1] == null) {
            lastGroup[1] = currentIdx - 1;
          }
        } else if (!lastGroup || lastGroup[1] != null) {
          lastGroup = [currentIdx];
          collapsibleGroups.push(lastGroup);
        }
        if (currentIdx === arr.length - 1 && lastGroup && lastGroup[1] == null) {
          lastGroup[1] = currentIdx;
        }
        return collapsibleGroups;
      }, []);
      gridRowIterator.onColumn(columnGroup, name || '', columnIndex++, columnGroup.getLeafColumns().length - 1, collapsibleGroupRanges);
    });
  }
};
__decorate([Autowired('displayedGroupCreator')], GridSerializer.prototype, "displayedGroupCreator", void 0);
__decorate([Autowired('columnModel')], GridSerializer.prototype, "columnModel", void 0);
__decorate([Autowired('rowModel')], GridSerializer.prototype, "rowModel", void 0);
__decorate([Autowired('pinnedRowModel')], GridSerializer.prototype, "pinnedRowModel", void 0);
__decorate([Autowired('selectionService')], GridSerializer.prototype, "selectionService", void 0);
__decorate([Autowired('rowNodeSorter')], GridSerializer.prototype, "rowNodeSorter", void 0);
__decorate([Autowired('sortController')], GridSerializer.prototype, "sortController", void 0);
GridSerializer = __decorate([Bean("gridSerializer")], GridSerializer);
export { GridSerializer };
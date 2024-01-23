var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, Autowired, Bean, BeanStub, RowNode } from "@/components/zing-grid/@zing-grid-community/core/main.js";
export const GROUP_MISSING_KEY_ID = 'zing-Grid-MissingKey';
let BlockUtils = class BlockUtils extends BeanStub {
  createRowNode(params) {
    const rowNode = new RowNode(this.beans);
    const rowHeight = params.rowHeight != null ? params.rowHeight : this.gridOptionsService.getRowHeightAsNumber();
    rowNode.setRowHeight(rowHeight);
    rowNode.group = params.group;
    rowNode.leafGroup = params.leafGroup;
    rowNode.level = params.level;
    rowNode.uiLevel = params.level;
    rowNode.parent = params.parent;
    rowNode.stub = true;
    rowNode.__needsRefreshWhenVisible = false;
    if (rowNode.group) {
      rowNode.expanded = false;
      rowNode.field = params.field;
      rowNode.rowGroupColumn = params.rowGroupColumn;
    }
    return rowNode;
  }
  destroyRowNodes(rowNodes) {
    if (rowNodes) {
      rowNodes.forEach(row => this.destroyRowNode(row));
    }
  }
  destroyRowNode(rowNode, preserveStore = false) {
    if (rowNode.childStore && !preserveStore) {
      this.destroyBean(rowNode.childStore);
      rowNode.childStore = null;
    }
    if (rowNode.sibling && !rowNode.footer) {
      this.destroyRowNode(rowNode.sibling, false);
    }
    rowNode.clearRowTopAndRowIndex();
    if (rowNode.id != null) {
      this.nodeManager.removeNode(rowNode);
    }
  }
  setTreeGroupInfo(rowNode) {
    rowNode.updateHasChildren();
    const getKeyFunc = this.gridOptionsService.get('getServerSideGroupKey');
    if (rowNode.hasChildren() && getKeyFunc != null) {
      rowNode.key = getKeyFunc(rowNode.data);
    }
    if (!rowNode.hasChildren() && rowNode.childStore != null) {
      this.destroyBean(rowNode.childStore);
      rowNode.childStore = null;
      rowNode.expanded = false;
    }
  }
  setRowGroupInfo(rowNode) {
    rowNode.key = this.valueService.getValue(rowNode.rowGroupColumn, rowNode);
    if (rowNode.key === null || rowNode.key === undefined) {
      _.doOnce(() => {
        console.warn(`ZING Grid: null and undefined values are not allowed for server side row model keys`);
        if (rowNode.rowGroupColumn) {
          console.warn(`column = ${rowNode.rowGroupColumn.getId()}`);
        }
        console.warn(`data is `, rowNode.data);
      }, 'ServerSideBlock-CannotHaveNullOrUndefinedForKey');
    }
    const getGroupIncludeFooter = this.beans.gridOptionsService.getGroupIncludeFooter();
    const doesRowShowFooter = getGroupIncludeFooter({
      node: rowNode
    });
    if (doesRowShowFooter) {
      rowNode.createFooter();
      if (rowNode.sibling) {
        rowNode.sibling.uiLevel = rowNode.uiLevel + 1;
      }
    }
  }
  setMasterDetailInfo(rowNode) {
    const isMasterFunc = this.gridOptionsService.get('isRowMaster');
    if (isMasterFunc != null) {
      rowNode.master = isMasterFunc(rowNode.data);
    } else {
      rowNode.master = true;
    }
  }
  updateDataIntoRowNode(rowNode, data) {
    rowNode.updateData(data);
    if (this.gridOptionsService.get('treeData')) {
      this.setTreeGroupInfo(rowNode);
      this.setChildCountIntoRowNode(rowNode);
    } else if (rowNode.group) {
      this.setChildCountIntoRowNode(rowNode);
      if (!rowNode.footer) {
        const getGroupIncludeFooter = this.beans.gridOptionsService.getGroupIncludeFooter();
        const doesRowShowFooter = getGroupIncludeFooter({
          node: rowNode
        });
        if (doesRowShowFooter) {
          if (rowNode.sibling) {
            rowNode.sibling.updateData(data);
          } else {
            rowNode.createFooter();
          }
        } else if (rowNode.sibling) {
          rowNode.destroyFooter();
        }
      }
    } else if (this.gridOptionsService.get('masterDetail')) {}
  }
  setDataIntoRowNode(rowNode, data, defaultId, cachedRowHeight) {
    var _a;
    rowNode.stub = false;
    const treeData = this.gridOptionsService.get('treeData');
    if (_.exists(data)) {
      rowNode.setDataAndId(data, defaultId);
      if (treeData) {
        this.setTreeGroupInfo(rowNode);
      } else if (rowNode.group) {
        this.setRowGroupInfo(rowNode);
      } else if (this.gridOptionsService.get('masterDetail')) {
        this.setMasterDetailInfo(rowNode);
      }
    } else {
      rowNode.setDataAndId(undefined, undefined);
      rowNode.key = null;
    }
    if (treeData || rowNode.group) {
      this.setGroupDataIntoRowNode(rowNode);
      this.setChildCountIntoRowNode(rowNode);
    }
    if (_.exists(data)) {
      rowNode.setRowHeight(this.gridOptionsService.getRowHeightForNode(rowNode, false, cachedRowHeight).height);
      (_a = rowNode.sibling) === null || _a === void 0 ? void 0 : _a.setRowHeight(this.gridOptionsService.getRowHeightForNode(rowNode.sibling, false, cachedRowHeight).height);
    }
  }
  setChildCountIntoRowNode(rowNode) {
    const getChildCount = this.gridOptionsService.get('getChildCount');
    if (getChildCount) {
      rowNode.setAllChildrenCount(getChildCount(rowNode.data));
    }
  }
  setGroupDataIntoRowNode(rowNode) {
    const groupDisplayCols = this.columnModel.getGroupDisplayColumns();
    const usingTreeData = this.gridOptionsService.get('treeData');
    groupDisplayCols.forEach(col => {
      if (rowNode.groupData == null) {
        rowNode.groupData = {};
      }
      if (usingTreeData) {
        rowNode.groupData[col.getColId()] = rowNode.key;
      } else if (col.isRowGroupDisplayed(rowNode.rowGroupColumn.getId())) {
        const groupValue = this.valueService.getValue(rowNode.rowGroupColumn, rowNode);
        rowNode.groupData[col.getColId()] = groupValue;
      }
    });
  }
  clearDisplayIndex(rowNode) {
    rowNode.clearRowTopAndRowIndex();
    const hasChildStore = rowNode.hasChildren() && _.exists(rowNode.childStore);
    if (hasChildStore) {
      const childStore = rowNode.childStore;
      childStore.clearDisplayIndexes();
    }
    const hasDetailNode = rowNode.master && rowNode.detailNode;
    if (hasDetailNode) {
      rowNode.detailNode.clearRowTopAndRowIndex();
    }
  }
  setDisplayIndex(rowNode, displayIndexSeq, nextRowTop) {
    rowNode.setRowIndex(displayIndexSeq.next());
    rowNode.setRowTop(nextRowTop.value);
    nextRowTop.value += rowNode.rowHeight;
    if (rowNode.footer) {
      return;
    }
    const hasDetailRow = rowNode.master;
    if (hasDetailRow) {
      if (rowNode.expanded && rowNode.detailNode) {
        rowNode.detailNode.setRowIndex(displayIndexSeq.next());
        rowNode.detailNode.setRowTop(nextRowTop.value);
        nextRowTop.value += rowNode.detailNode.rowHeight;
      } else if (rowNode.detailNode) {
        rowNode.detailNode.clearRowTopAndRowIndex();
      }
    }
    const hasChildStore = rowNode.hasChildren() && _.exists(rowNode.childStore);
    if (hasChildStore) {
      const childStore = rowNode.childStore;
      if (rowNode.expanded) {
        childStore.setDisplayIndexes(displayIndexSeq, nextRowTop);
      } else {
        childStore.clearDisplayIndexes();
      }
    }
  }
  binarySearchForDisplayIndex(displayRowIndex, rowNodes) {
    let bottomPointer = 0;
    let topPointer = rowNodes.length - 1;
    if (_.missing(topPointer) || _.missing(bottomPointer)) {
      console.warn(`ZING Grid: error: topPointer = ${topPointer}, bottomPointer = ${bottomPointer}`);
      return undefined;
    }
    while (true) {
      const midPointer = Math.floor((bottomPointer + topPointer) / 2);
      const currentRowNode = rowNodes[midPointer];
      if (currentRowNode.rowIndex === displayRowIndex) {
        return currentRowNode;
      }
      const expandedMasterRow = currentRowNode.master && currentRowNode.expanded;
      const detailNode = currentRowNode.detailNode;
      if (expandedMasterRow && detailNode && detailNode.rowIndex === displayRowIndex) {
        return currentRowNode.detailNode;
      }
      const childStore = currentRowNode.childStore;
      if (currentRowNode.expanded && childStore && childStore.isDisplayIndexInStore(displayRowIndex)) {
        return childStore.getRowUsingDisplayIndex(displayRowIndex);
      }
      if (currentRowNode.rowIndex < displayRowIndex) {
        bottomPointer = midPointer + 1;
      } else if (currentRowNode.rowIndex > displayRowIndex) {
        topPointer = midPointer - 1;
      } else {
        console.warn(`ZING Grid: error: unable to locate rowIndex = ${displayRowIndex} in cache`);
        return undefined;
      }
    }
  }
  extractRowBounds(rowNode, index) {
    const extractRowBounds = currentRowNode => ({
      rowHeight: currentRowNode.rowHeight,
      rowTop: currentRowNode.rowTop
    });
    if (rowNode.rowIndex === index) {
      return extractRowBounds(rowNode);
    }
    if (rowNode.hasChildren() && rowNode.expanded && _.exists(rowNode.childStore)) {
      const childStore = rowNode.childStore;
      if (childStore.isDisplayIndexInStore(index)) {
        return childStore.getRowBounds(index);
      }
    } else if (rowNode.master && rowNode.expanded && _.exists(rowNode.detailNode)) {
      if (rowNode.detailNode.rowIndex === index) {
        return extractRowBounds(rowNode.detailNode);
      }
    }
  }
  getIndexAtPixel(rowNode, pixel) {
    if (rowNode.isPixelInRange(pixel)) {
      return rowNode.rowIndex;
    }
    const expandedMasterRow = rowNode.master && rowNode.expanded;
    const detailNode = rowNode.detailNode;
    if (expandedMasterRow && detailNode && detailNode.isPixelInRange(pixel)) {
      return rowNode.detailNode.rowIndex;
    }
    if (rowNode.hasChildren() && rowNode.expanded && _.exists(rowNode.childStore)) {
      const childStore = rowNode.childStore;
      if (childStore.isPixelInRange(pixel)) {
        return childStore.getRowIndexAtPixel(pixel);
      }
    }
    return null;
  }
  createNodeIdPrefix(parentRowNode) {
    const parts = [];
    let rowNode = parentRowNode;
    while (rowNode && rowNode.level >= 0) {
      if (rowNode.key === '') {
        parts.push(GROUP_MISSING_KEY_ID);
      } else {
        parts.push(rowNode.key);
      }
      rowNode = rowNode.parent;
    }
    if (parts.length > 0) {
      return parts.reverse().join('-');
    }
    return undefined;
  }
  checkOpenByDefault(rowNode) {
    return this.expansionService.checkOpenByDefault(rowNode);
  }
};
__decorate([Autowired('valueService')], BlockUtils.prototype, "valueService", void 0);
__decorate([Autowired('columnModel')], BlockUtils.prototype, "columnModel", void 0);
__decorate([Autowired('ssrmNodeManager')], BlockUtils.prototype, "nodeManager", void 0);
__decorate([Autowired('beans')], BlockUtils.prototype, "beans", void 0);
__decorate([Autowired('expansionService')], BlockUtils.prototype, "expansionService", void 0);
BlockUtils = __decorate([Bean('ssrmBlockUtils')], BlockUtils);
export { BlockUtils };
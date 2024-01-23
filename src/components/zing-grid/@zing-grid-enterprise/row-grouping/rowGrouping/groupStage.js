var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, Autowired, Bean, BeanStub, RowNode } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { BatchRemover } from "./batchRemover";
let GroupStage = class GroupStage extends BeanStub {
  execute(params) {
    const details = this.createGroupingDetails(params);
    if (details.transactions) {
      this.handleTransaction(details);
    } else {
      const afterColsChanged = params.afterColumnsChanged === true;
      this.shotgunResetEverything(details, afterColsChanged);
    }
    if (!details.usingTreeData) {
      this.positionLeafsAndGroups(params.changedPath);
      this.orderGroups(details);
    }
    this.selectableService.updateSelectableAfterGrouping();
  }
  positionLeafsAndGroups(changedPath) {
    changedPath.forEachChangedNodeDepthFirst(group => {
      if (group.childrenAfterGroup) {
        const leafNodes = [];
        const groupNodes = [];
        let unbalancedNode;
        group.childrenAfterGroup.forEach(row => {
          var _a;
          if (!((_a = row.childrenAfterGroup) === null || _a === void 0 ? void 0 : _a.length)) {
            leafNodes.push(row);
          } else {
            if (row.key === '' && !unbalancedNode) {
              unbalancedNode = row;
            } else {
              groupNodes.push(row);
            }
          }
        });
        if (unbalancedNode) {
          groupNodes.push(unbalancedNode);
        }
        group.childrenAfterGroup = [...leafNodes, ...groupNodes];
      }
    }, false);
  }
  createGroupingDetails(params) {
    var _a;
    const {
      rowNode,
      changedPath,
      rowNodeTransactions,
      rowNodeOrder
    } = params;
    const usingTreeData = this.gridOptionsService.get('treeData');
    const groupedCols = usingTreeData ? null : this.columnModel.getRowGroupColumns();
    const details = {
      includeParents: !this.gridOptionsService.get('suppressParentsInRowNodes'),
      expandByDefault: this.gridOptionsService.get('groupDefaultExpanded'),
      groupedCols: groupedCols,
      rootNode: rowNode,
      pivotMode: this.columnModel.isPivotMode(),
      groupedColCount: usingTreeData || !groupedCols ? 0 : groupedCols.length,
      rowNodeOrder: rowNodeOrder,
      transactions: rowNodeTransactions,
      changedPath: changedPath,
      groupAllowUnbalanced: this.gridOptionsService.get('groupAllowUnbalanced'),
      isGroupOpenByDefault: this.gridOptionsService.getCallback('isGroupOpenByDefault'),
      initialGroupOrderComparator: this.gridOptionsService.getCallback('initialGroupOrderComparator'),
      usingTreeData: usingTreeData,
      suppressGroupMaintainValueType: this.gridOptionsService.get('suppressGroupMaintainValueType'),
      getDataPath: usingTreeData ? this.gridOptionsService.get('getDataPath') : undefined,
      keyCreators: (_a = groupedCols === null || groupedCols === void 0 ? void 0 : groupedCols.map(column => column.getColDef().keyCreator)) !== null && _a !== void 0 ? _a : []
    };
    return details;
  }
  handleTransaction(details) {
    details.transactions.forEach(tran => {
      const batchRemover = !details.usingTreeData ? new BatchRemover() : undefined;
      if (_.existsAndNotEmpty(tran.remove)) {
        this.removeNodes(tran.remove, details, batchRemover);
      }
      if (_.existsAndNotEmpty(tran.update)) {
        this.moveNodesInWrongPath(tran.update, details, batchRemover);
      }
      if (_.existsAndNotEmpty(tran.add)) {
        this.insertNodes(tran.add, details, false);
      }
      if (batchRemover) {
        const parentsWithChildrenRemoved = batchRemover.getAllParents().slice();
        batchRemover.flush();
        this.removeEmptyGroups(parentsWithChildrenRemoved, details);
      }
    });
    if (details.rowNodeOrder) {
      this.sortChildren(details);
    }
  }
  sortChildren(details) {
    details.changedPath.forEachChangedNodeDepthFirst(node => {
      if (!node.childrenAfterGroup) {
        return;
      }
      const didSort = _.sortRowNodesByOrder(node.childrenAfterGroup, details.rowNodeOrder);
      if (didSort) {
        details.changedPath.addParentNode(node);
      }
    }, false, true);
  }
  orderGroups(details) {
    const comparator = details.initialGroupOrderComparator;
    if (_.exists(comparator)) {
      recursiveSort(details.rootNode);
    }
    function recursiveSort(rowNode) {
      const doSort = _.exists(rowNode.childrenAfterGroup) && !rowNode.leafGroup;
      if (doSort) {
        rowNode.childrenAfterGroup.sort((nodeA, nodeB) => comparator({
          nodeA,
          nodeB
        }));
        rowNode.childrenAfterGroup.forEach(childNode => recursiveSort(childNode));
      }
    }
  }
  getExistingPathForNode(node, details) {
    const res = [];
    let pointer = details.usingTreeData ? node : node.parent;
    while (pointer && pointer !== details.rootNode) {
      res.push({
        key: pointer.key,
        rowGroupColumn: pointer.rowGroupColumn,
        field: pointer.field
      });
      pointer = pointer.parent;
    }
    res.reverse();
    return res;
  }
  moveNodesInWrongPath(childNodes, details, batchRemover) {
    childNodes.forEach(childNode => {
      if (details.changedPath.isActive()) {
        details.changedPath.addParentNode(childNode.parent);
      }
      const infoToKeyMapper = item => item.key;
      const oldPath = this.getExistingPathForNode(childNode, details).map(infoToKeyMapper);
      const newPath = this.getGroupInfo(childNode, details).map(infoToKeyMapper);
      const nodeInCorrectPath = _.areEqual(oldPath, newPath);
      if (!nodeInCorrectPath) {
        this.moveNode(childNode, details, batchRemover);
      }
    });
  }
  moveNode(childNode, details, batchRemover) {
    this.removeNodesInStages([childNode], details, batchRemover);
    this.insertOneNode(childNode, details, true, batchRemover);
    childNode.setData(childNode.data);
    if (details.changedPath.isActive()) {
      const newParent = childNode.parent;
      details.changedPath.addParentNode(newParent);
    }
  }
  removeNodes(leafRowNodes, details, batchRemover) {
    this.removeNodesInStages(leafRowNodes, details, batchRemover);
    if (details.changedPath.isActive()) {
      leafRowNodes.forEach(rowNode => details.changedPath.addParentNode(rowNode.parent));
    }
  }
  removeNodesInStages(leafRowNodes, details, batchRemover) {
    this.removeNodesFromParents(leafRowNodes, details, batchRemover);
    if (details.usingTreeData) {
      this.postRemoveCreateFillerNodes(leafRowNodes, details);
      const nodeParents = leafRowNodes.map(n => n.parent);
      this.removeEmptyGroups(nodeParents, details);
    }
  }
  forEachParentGroup(details, group, callback) {
    let pointer = group;
    while (pointer && pointer !== details.rootNode) {
      callback(pointer);
      pointer = pointer.parent;
    }
  }
  removeNodesFromParents(nodesToRemove, details, provided) {
    const batchRemoverIsLocal = provided == null;
    const batchRemoverToUse = provided ? provided : new BatchRemover();
    nodesToRemove.forEach(nodeToRemove => {
      this.removeFromParent(nodeToRemove, batchRemoverToUse);
      this.forEachParentGroup(details, nodeToRemove.parent, parentNode => {
        batchRemoverToUse.removeFromAllLeafChildren(parentNode, nodeToRemove);
      });
    });
    if (batchRemoverIsLocal) {
      batchRemoverToUse.flush();
    }
  }
  postRemoveCreateFillerNodes(nodesToRemove, details) {
    nodesToRemove.forEach(nodeToRemove => {
      const replaceWithGroup = nodeToRemove.hasChildren();
      if (replaceWithGroup) {
        const oldPath = this.getExistingPathForNode(nodeToRemove, details);
        const newGroupNode = this.findParentForNode(nodeToRemove, oldPath, details);
        newGroupNode.expanded = nodeToRemove.expanded;
        newGroupNode.allLeafChildren = nodeToRemove.allLeafChildren;
        newGroupNode.childrenAfterGroup = nodeToRemove.childrenAfterGroup;
        newGroupNode.childrenMapped = nodeToRemove.childrenMapped;
        newGroupNode.updateHasChildren();
        newGroupNode.childrenAfterGroup.forEach(rowNode => rowNode.parent = newGroupNode);
      }
    });
  }
  removeEmptyGroups(possibleEmptyGroups, details) {
    let checkAgain = true;
    const groupShouldBeRemoved = rowNode => {
      const mapKey = this.getChildrenMappedKey(rowNode.key, rowNode.rowGroupColumn);
      const parentRowNode = rowNode.parent;
      const groupAlreadyRemoved = parentRowNode && parentRowNode.childrenMapped ? !parentRowNode.childrenMapped[mapKey] : true;
      if (groupAlreadyRemoved) {
        return false;
      }
      return !!rowNode.isEmptyRowGroupNode();
    };
    while (checkAgain) {
      checkAgain = false;
      const batchRemover = new BatchRemover();
      possibleEmptyGroups.forEach(possibleEmptyGroup => {
        this.forEachParentGroup(details, possibleEmptyGroup, rowNode => {
          if (groupShouldBeRemoved(rowNode)) {
            checkAgain = true;
            this.removeFromParent(rowNode, batchRemover);
            rowNode.setSelectedParams({
              newValue: false,
              source: 'rowGroupChanged'
            });
          }
        });
      });
      batchRemover.flush();
    }
  }
  removeFromParent(child, batchRemover) {
    if (child.parent) {
      if (batchRemover) {
        batchRemover.removeFromChildrenAfterGroup(child.parent, child);
      } else {
        _.removeFromArray(child.parent.childrenAfterGroup, child);
        child.parent.updateHasChildren();
      }
    }
    const mapKey = this.getChildrenMappedKey(child.key, child.rowGroupColumn);
    if (child.parent && child.parent.childrenMapped) {
      child.parent.childrenMapped[mapKey] = undefined;
    }
    child.setRowTop(null);
    child.setRowIndex(null);
  }
  addToParent(child, parent) {
    const mapKey = this.getChildrenMappedKey(child.key, child.rowGroupColumn);
    if (parent) {
      const children = parent.childrenMapped != null;
      if (children) {
        parent.childrenMapped[mapKey] = child;
      }
      parent.childrenAfterGroup.push(child);
      parent.updateHasChildren();
    }
  }
  areGroupColsEqual(d1, d2) {
    if (d1 == null || d2 == null || d1.pivotMode !== d2.pivotMode) {
      return false;
    }
    return _.areEqual(d1.groupedCols, d2.groupedCols) && _.areEqual(d1.keyCreators, d2.keyCreators);
  }
  checkAllGroupDataAfterColsChanged(details) {
    const recurse = rowNodes => {
      if (!rowNodes) {
        return;
      }
      rowNodes.forEach(rowNode => {
        const isLeafNode = !details.usingTreeData && !rowNode.group;
        if (isLeafNode) {
          return;
        }
        const groupInfo = {
          field: rowNode.field,
          key: rowNode.key,
          rowGroupColumn: rowNode.rowGroupColumn,
          leafNode: rowNode.allLeafChildren[0]
        };
        this.setGroupData(rowNode, groupInfo, details);
        recurse(rowNode.childrenAfterGroup);
      });
    };
    recurse(details.rootNode.childrenAfterGroup);
  }
  shotgunResetEverything(details, afterColumnsChanged) {
    if (this.noChangeInGroupingColumns(details, afterColumnsChanged)) {
      return;
    }
    this.selectionService.filterFromSelection(node => node && !node.group);
    const {
      rootNode,
      groupedCols
    } = details;
    rootNode.leafGroup = details.usingTreeData ? false : groupedCols.length === 0;
    rootNode.childrenAfterGroup = [];
    rootNode.childrenMapped = {};
    rootNode.updateHasChildren();
    const sibling = rootNode.sibling;
    if (sibling) {
      sibling.childrenAfterGroup = rootNode.childrenAfterGroup;
      sibling.childrenMapped = rootNode.childrenMapped;
    }
    this.insertNodes(rootNode.allLeafChildren, details, false);
  }
  noChangeInGroupingColumns(details, afterColumnsChanged) {
    let noFurtherProcessingNeeded = false;
    const groupDisplayColumns = this.columnModel.getGroupDisplayColumns();
    const newGroupDisplayColIds = groupDisplayColumns ? groupDisplayColumns.map(c => c.getId()).join('-') : '';
    if (afterColumnsChanged) {
      noFurtherProcessingNeeded = details.usingTreeData || this.areGroupColsEqual(details, this.oldGroupingDetails);
      if (this.oldGroupDisplayColIds !== newGroupDisplayColIds) {
        this.checkAllGroupDataAfterColsChanged(details);
      }
    }
    this.oldGroupingDetails = details;
    this.oldGroupDisplayColIds = newGroupDisplayColIds;
    return noFurtherProcessingNeeded;
  }
  insertNodes(newRowNodes, details, isMove) {
    newRowNodes.forEach(rowNode => {
      this.insertOneNode(rowNode, details, isMove);
      if (details.changedPath.isActive()) {
        details.changedPath.addParentNode(rowNode.parent);
      }
    });
  }
  insertOneNode(childNode, details, isMove, batchRemover) {
    const path = this.getGroupInfo(childNode, details);
    const parentGroup = this.findParentForNode(childNode, path, details, batchRemover);
    if (!parentGroup.group) {
      console.warn(`ZING Grid: duplicate group keys for row data, keys should be unique`, [parentGroup.data, childNode.data]);
    }
    if (details.usingTreeData) {
      this.swapGroupWithUserNode(parentGroup, childNode, isMove);
    } else {
      childNode.parent = parentGroup;
      childNode.level = path.length;
      parentGroup.childrenAfterGroup.push(childNode);
      parentGroup.updateHasChildren();
    }
  }
  findParentForNode(childNode, path, details, batchRemover) {
    let nextNode = details.rootNode;
    path.forEach((groupInfo, level) => {
      nextNode = this.getOrCreateNextNode(nextNode, groupInfo, level, details);
      if (!(batchRemover === null || batchRemover === void 0 ? void 0 : batchRemover.isRemoveFromAllLeafChildren(nextNode, childNode))) {
        nextNode.allLeafChildren.push(childNode);
      } else {
        batchRemover === null || batchRemover === void 0 ? void 0 : batchRemover.preventRemoveFromAllLeafChildren(nextNode, childNode);
      }
    });
    return nextNode;
  }
  swapGroupWithUserNode(fillerGroup, userGroup, isMove) {
    userGroup.parent = fillerGroup.parent;
    userGroup.key = fillerGroup.key;
    userGroup.field = fillerGroup.field;
    userGroup.groupData = fillerGroup.groupData;
    userGroup.level = fillerGroup.level;
    if (!isMove) {
      userGroup.expanded = fillerGroup.expanded;
    }
    userGroup.leafGroup = fillerGroup.leafGroup;
    userGroup.rowGroupIndex = fillerGroup.rowGroupIndex;
    userGroup.allLeafChildren = fillerGroup.allLeafChildren;
    userGroup.childrenAfterGroup = fillerGroup.childrenAfterGroup;
    userGroup.childrenMapped = fillerGroup.childrenMapped;
    userGroup.sibling = fillerGroup.sibling;
    userGroup.updateHasChildren();
    this.removeFromParent(fillerGroup);
    userGroup.childrenAfterGroup.forEach(rowNode => rowNode.parent = userGroup);
    this.addToParent(userGroup, fillerGroup.parent);
  }
  getOrCreateNextNode(parentGroup, groupInfo, level, details) {
    const key = this.getChildrenMappedKey(groupInfo.key, groupInfo.rowGroupColumn);
    let nextNode = parentGroup.childrenMapped ? parentGroup.childrenMapped[key] : undefined;
    if (!nextNode) {
      nextNode = this.createGroup(groupInfo, parentGroup, level, details);
      this.addToParent(nextNode, parentGroup);
    }
    return nextNode;
  }
  createGroup(groupInfo, parent, level, details) {
    const groupNode = new RowNode(this.beans);
    groupNode.group = true;
    groupNode.field = groupInfo.field;
    groupNode.rowGroupColumn = groupInfo.rowGroupColumn;
    this.setGroupData(groupNode, groupInfo, details);
    groupNode.key = groupInfo.key;
    groupNode.id = this.createGroupId(groupNode, parent, details.usingTreeData, level);
    groupNode.level = level;
    groupNode.leafGroup = details.usingTreeData ? false : level === details.groupedColCount - 1;
    groupNode.allLeafChildren = [];
    groupNode.setAllChildrenCount(0);
    groupNode.rowGroupIndex = details.usingTreeData ? null : level;
    groupNode.childrenAfterGroup = [];
    groupNode.childrenMapped = {};
    groupNode.updateHasChildren();
    groupNode.parent = details.includeParents ? parent : null;
    this.setExpandedInitialValue(details, groupNode);
    return groupNode;
  }
  createGroupId(node, parent, usingTreeData, level) {
    let createGroupId;
    if (usingTreeData) {
      createGroupId = (node, parent, level) => {
        if (level < 0) {
          return null;
        }
        const parentId = parent ? createGroupId(parent, parent.parent, level - 1) : null;
        return `${parentId == null ? '' : parentId + '-'}${level}-${node.key}`;
      };
    } else {
      createGroupId = (node, parent) => {
        if (!node.rowGroupColumn) {
          return null;
        }
        const parentId = parent ? createGroupId(parent, parent.parent, 0) : null;
        return `${parentId == null ? '' : parentId + '-'}${node.rowGroupColumn.getColId()}-${node.key}`;
      };
    }
    return RowNode.ID_PREFIX_ROW_GROUP + createGroupId(node, parent, level);
  }
  setGroupData(groupNode, groupInfo, details) {
    groupNode.groupData = {};
    const groupDisplayCols = this.columnModel.getGroupDisplayColumns();
    groupDisplayCols.forEach(col => {
      const isTreeData = details.usingTreeData;
      if (isTreeData) {
        groupNode.groupData[col.getColId()] = groupInfo.key;
        return;
      }
      const groupColumn = groupNode.rowGroupColumn;
      const isRowGroupDisplayed = groupColumn !== null && col.isRowGroupDisplayed(groupColumn.getId());
      if (isRowGroupDisplayed) {
        if (details.suppressGroupMaintainValueType) {
          groupNode.groupData[col.getColId()] = groupInfo.key;
        } else {
          groupNode.groupData[col.getColId()] = this.valueService.getValue(groupColumn, groupInfo.leafNode);
        }
      }
    });
  }
  getChildrenMappedKey(key, rowGroupColumn) {
    if (rowGroupColumn) {
      return rowGroupColumn.getId() + '-' + key;
    }
    return key;
  }
  setExpandedInitialValue(details, groupNode) {
    if (details.pivotMode && groupNode.leafGroup) {
      groupNode.expanded = false;
      return;
    }
    const userCallback = details.isGroupOpenByDefault;
    if (userCallback) {
      const params = {
        rowNode: groupNode,
        field: groupNode.field,
        key: groupNode.key,
        level: groupNode.level,
        rowGroupColumn: groupNode.rowGroupColumn
      };
      groupNode.expanded = userCallback(params) == true;
      return;
    }
    const {
      expandByDefault
    } = details;
    if (details.expandByDefault === -1) {
      groupNode.expanded = true;
      return;
    }
    groupNode.expanded = groupNode.level < expandByDefault;
  }
  getGroupInfo(rowNode, details) {
    if (details.usingTreeData) {
      return this.getGroupInfoFromCallback(rowNode, details);
    }
    return this.getGroupInfoFromGroupColumns(rowNode, details);
  }
  getGroupInfoFromCallback(rowNode, details) {
    const keys = details.getDataPath ? details.getDataPath(rowNode.data) : null;
    if (keys === null || keys === undefined || keys.length === 0) {
      _.warnOnce(`getDataPath() should not return an empty path for data ${rowNode.data}`);
    }
    const groupInfoMapper = key => ({
      key,
      field: null,
      rowGroupColumn: null
    });
    return keys ? keys.map(groupInfoMapper) : [];
  }
  getGroupInfoFromGroupColumns(rowNode, details) {
    const res = [];
    details.groupedCols.forEach(groupCol => {
      let key = this.valueService.getKeyForNode(groupCol, rowNode);
      let keyExists = key !== null && key !== undefined && key !== '';
      const createGroupForEmpty = details.pivotMode || !details.groupAllowUnbalanced;
      if (createGroupForEmpty && !keyExists) {
        key = '';
        keyExists = true;
      }
      if (keyExists) {
        const item = {
          key: key,
          field: groupCol.getColDef().field,
          rowGroupColumn: groupCol,
          leafNode: rowNode
        };
        res.push(item);
      }
    });
    return res;
  }
};
__decorate([Autowired('columnModel')], GroupStage.prototype, "columnModel", void 0);
__decorate([Autowired('selectableService')], GroupStage.prototype, "selectableService", void 0);
__decorate([Autowired('valueService')], GroupStage.prototype, "valueService", void 0);
__decorate([Autowired('beans')], GroupStage.prototype, "beans", void 0);
__decorate([Autowired('selectionService')], GroupStage.prototype, "selectionService", void 0);
GroupStage = __decorate([Bean('groupStage')], GroupStage);
export { GroupStage };
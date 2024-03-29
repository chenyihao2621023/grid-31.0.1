import { Events, RowNode, _ } from "@/components/zing-grid/@zing-grid-community/core/main.js";
export class ClientSideNodeManager {
  constructor(rootNode, gridOptionsService, eventService, columnModel, selectionService, beans) {
    this.nextId = 0;
    this.allNodesMap = {};
    this.dataLoaded = false;
    this.rootNode = rootNode;
    this.gridOptionsService = gridOptionsService;
    this.eventService = eventService;
    this.columnModel = columnModel;
    this.beans = beans;
    this.selectionService = selectionService;
    this.rootNode.group = true;
    this.rootNode.level = -1;
    this.rootNode.id = ClientSideNodeManager.ROOT_NODE_ID;
    this.rootNode.allLeafChildren = [];
    this.rootNode.childrenAfterGroup = [];
    this.rootNode.childrenAfterSort = [];
    this.rootNode.childrenAfterAggFilter = [];
    this.rootNode.childrenAfterFilter = [];
  }
  getCopyOfNodesMap() {
    return _.cloneObject(this.allNodesMap);
  }
  getRowNode(id) {
    return this.allNodesMap[id];
  }
  setRowData(rowData) {
    if (typeof rowData === 'string') {
      console.warn('ZING Grid: rowData must be an array, however you passed in a string. If you are loading JSON, make sure you convert the JSON string to JavaScript objects first');
      return;
    }
    this.dataLoaded = true;
    this.dispatchRowDataUpdateStartedEvent(rowData);
    const rootNode = this.rootNode;
    const sibling = this.rootNode.sibling;
    rootNode.childrenAfterFilter = null;
    rootNode.childrenAfterGroup = null;
    rootNode.childrenAfterAggFilter = null;
    rootNode.childrenAfterSort = null;
    rootNode.childrenMapped = null;
    rootNode.updateHasChildren();
    this.nextId = 0;
    this.allNodesMap = {};
    if (rowData) {
      rootNode.allLeafChildren = rowData.map(dataItem => this.createNode(dataItem, this.rootNode, ClientSideNodeManager.TOP_LEVEL));
    } else {
      rootNode.allLeafChildren = [];
      rootNode.childrenAfterGroup = [];
    }
    if (sibling) {
      sibling.childrenAfterFilter = rootNode.childrenAfterFilter;
      sibling.childrenAfterGroup = rootNode.childrenAfterGroup;
      sibling.childrenAfterAggFilter = rootNode.childrenAfterAggFilter;
      sibling.childrenAfterSort = rootNode.childrenAfterSort;
      sibling.childrenMapped = rootNode.childrenMapped;
      sibling.allLeafChildren = rootNode.allLeafChildren;
    }
  }
  updateRowData(rowDataTran, rowNodeOrder) {
    this.dataLoaded = true;
    this.dispatchRowDataUpdateStartedEvent(rowDataTran.add);
    const rowNodeTransaction = {
      remove: [],
      update: [],
      add: []
    };
    const nodesToUnselect = [];
    this.executeRemove(rowDataTran, rowNodeTransaction, nodesToUnselect);
    this.executeUpdate(rowDataTran, rowNodeTransaction, nodesToUnselect);
    this.executeAdd(rowDataTran, rowNodeTransaction);
    this.updateSelection(nodesToUnselect, 'rowDataChanged');
    if (rowNodeOrder) {
      _.sortRowNodesByOrder(this.rootNode.allLeafChildren, rowNodeOrder);
    }
    return rowNodeTransaction;
  }
  hasData() {
    return this.dataLoaded;
  }
  dispatchRowDataUpdateStartedEvent(rowData) {
    const event = {
      type: Events.EVENT_ROW_DATA_UPDATE_STARTED,
      firstRowData: (rowData === null || rowData === void 0 ? void 0 : rowData.length) ? rowData[0] : null
    };
    this.eventService.dispatchEvent(event);
  }
  updateSelection(nodesToUnselect, source) {
    const selectionChanged = nodesToUnselect.length > 0;
    if (selectionChanged) {
      this.selectionService.setNodesSelected({
        newValue: false,
        nodes: nodesToUnselect,
        suppressFinishActions: true,
        source
      });
    }
    this.selectionService.updateGroupsFromChildrenSelections(source);
    if (selectionChanged) {
      const event = {
        type: Events.EVENT_SELECTION_CHANGED,
        source: source
      };
      this.eventService.dispatchEvent(event);
    }
  }
  executeAdd(rowDataTran, rowNodeTransaction) {
    var _a;
    const {
      add,
      addIndex
    } = rowDataTran;
    if (_.missingOrEmpty(add)) {
      return;
    }
    const newNodes = add.map(item => this.createNode(item, this.rootNode, ClientSideNodeManager.TOP_LEVEL));
    if (typeof addIndex === 'number' && addIndex >= 0) {
      const {
        allLeafChildren
      } = this.rootNode;
      const len = allLeafChildren.length;
      let normalisedAddIndex = addIndex;
      const isTreeData = this.gridOptionsService.get('treeData');
      if (isTreeData && addIndex > 0 && len > 0) {
        for (let i = 0; i < len; i++) {
          if (((_a = allLeafChildren[i]) === null || _a === void 0 ? void 0 : _a.rowIndex) == addIndex - 1) {
            normalisedAddIndex = i + 1;
            break;
          }
        }
      }
      const nodesBeforeIndex = allLeafChildren.slice(0, normalisedAddIndex);
      const nodesAfterIndex = allLeafChildren.slice(normalisedAddIndex, allLeafChildren.length);
      this.rootNode.allLeafChildren = [...nodesBeforeIndex, ...newNodes, ...nodesAfterIndex];
    } else {
      this.rootNode.allLeafChildren = [...this.rootNode.allLeafChildren, ...newNodes];
    }
    if (this.rootNode.sibling) {
      this.rootNode.sibling.allLeafChildren = this.rootNode.allLeafChildren;
    }
    rowNodeTransaction.add = newNodes;
  }
  executeRemove(rowDataTran, rowNodeTransaction, nodesToUnselect) {
    const {
      remove
    } = rowDataTran;
    if (_.missingOrEmpty(remove)) {
      return;
    }
    const rowIdsRemoved = {};
    remove.forEach(item => {
      const rowNode = this.lookupRowNode(item);
      if (!rowNode) {
        return;
      }
      if (rowNode.isSelected()) {
        nodesToUnselect.push(rowNode);
      }
      rowNode.clearRowTopAndRowIndex();
      rowIdsRemoved[rowNode.id] = true;
      delete this.allNodesMap[rowNode.id];
      rowNodeTransaction.remove.push(rowNode);
    });
    this.rootNode.allLeafChildren = this.rootNode.allLeafChildren.filter(rowNode => !rowIdsRemoved[rowNode.id]);
    if (this.rootNode.sibling) {
      this.rootNode.sibling.allLeafChildren = this.rootNode.allLeafChildren;
    }
  }
  executeUpdate(rowDataTran, rowNodeTransaction, nodesToUnselect) {
    const {
      update
    } = rowDataTran;
    if (_.missingOrEmpty(update)) {
      return;
    }
    update.forEach(item => {
      const rowNode = this.lookupRowNode(item);
      if (!rowNode) {
        return;
      }
      rowNode.updateData(item);
      if (!rowNode.selectable && rowNode.isSelected()) {
        nodesToUnselect.push(rowNode);
      }
      this.setMasterForRow(rowNode, item, ClientSideNodeManager.TOP_LEVEL, false);
      rowNodeTransaction.update.push(rowNode);
    });
  }
  lookupRowNode(data) {
    const getRowIdFunc = this.gridOptionsService.getCallback('getRowId');
    let rowNode;
    if (getRowIdFunc) {
      const id = getRowIdFunc({
        data,
        level: 0
      });
      rowNode = this.allNodesMap[id];
      if (!rowNode) {
        console.error(`ZING Grid: could not find row id=${id}, data item was not found for this id`);
        return null;
      }
    } else {
      rowNode = this.rootNode.allLeafChildren.find(node => node.data === data);
      if (!rowNode) {
        console.error(`ZING Grid: could not find data item as object was not found`, data);
        console.error(`Consider using getRowId to help the Grid find matching row data`);
        return null;
      }
    }
    return rowNode || null;
  }
  createNode(dataItem, parent, level) {
    const node = new RowNode(this.beans);
    node.group = false;
    this.setMasterForRow(node, dataItem, level, true);
    const suppressParentsInRowNodes = this.gridOptionsService.get('suppressParentsInRowNodes');
    if (parent && !suppressParentsInRowNodes) {
      node.parent = parent;
    }
    node.level = level;
    node.setDataAndId(dataItem, this.nextId.toString());
    if (this.allNodesMap[node.id]) {
      console.warn(`ZING Grid: duplicate node id '${node.id}' detected from getRowId callback, this could cause issues in your grid.`);
    }
    this.allNodesMap[node.id] = node;
    this.nextId++;
    return node;
  }
  setMasterForRow(rowNode, data, level, setExpanded) {
    const isTreeData = this.gridOptionsService.get('treeData');
    if (isTreeData) {
      rowNode.setMaster(false);
      if (setExpanded) {
        rowNode.expanded = false;
      }
    } else {
      const masterDetail = this.gridOptionsService.get('masterDetail');
      if (masterDetail) {
        const isRowMasterFunc = this.gridOptionsService.get('isRowMaster');
        if (isRowMasterFunc) {
          rowNode.setMaster(isRowMasterFunc(data));
        } else {
          rowNode.setMaster(true);
        }
      } else {
        rowNode.setMaster(false);
      }
      if (setExpanded) {
        const rowGroupColumns = this.columnModel.getRowGroupColumns();
        const numRowGroupColumns = rowGroupColumns ? rowGroupColumns.length : 0;
        const masterRowLevel = level + numRowGroupColumns;
        rowNode.expanded = rowNode.master ? this.isExpanded(masterRowLevel) : false;
      }
    }
  }
  isExpanded(level) {
    const expandByDefault = this.gridOptionsService.get('groupDefaultExpanded');
    if (expandByDefault === -1) {
      return true;
    }
    return level < expandByDefault;
  }
}
ClientSideNodeManager.TOP_LEVEL = 0;
ClientSideNodeManager.ROOT_NODE_ID = 'ROOT_NODE_ID';
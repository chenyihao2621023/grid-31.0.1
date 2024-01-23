export class ChangedPath {
  constructor(keepingColumns, rootNode) {
    this.active = true;
    this.nodeIdsToColumns = {};
    this.mapToItems = {};
    this.keepingColumns = keepingColumns;
    this.pathRoot = {
      rowNode: rootNode,
      children: null
    };
    this.mapToItems[rootNode.id] = this.pathRoot;
  }
  setInactive() {
    this.active = false;
  }
  isActive() {
    return this.active;
  }
  depthFirstSearchChangedPath(pathItem, callback) {
    if (pathItem.children) {
      for (let i = 0; i < pathItem.children.length; i++) {
        this.depthFirstSearchChangedPath(pathItem.children[i], callback);
      }
    }
    callback(pathItem.rowNode);
  }
  depthFirstSearchEverything(rowNode, callback, traverseEverything) {
    if (rowNode.childrenAfterGroup) {
      for (let i = 0; i < rowNode.childrenAfterGroup.length; i++) {
        const childNode = rowNode.childrenAfterGroup[i];
        if (childNode.childrenAfterGroup) {
          this.depthFirstSearchEverything(rowNode.childrenAfterGroup[i], callback, traverseEverything);
        } else if (traverseEverything) {
          callback(childNode);
        }
      }
    }
    callback(rowNode);
  }
  forEachChangedNodeDepthFirst(callback, traverseLeafNodes = false, includeUnchangedNodes = false) {
    if (this.active && !includeUnchangedNodes) {
      this.depthFirstSearchChangedPath(this.pathRoot, callback);
    } else {
      this.depthFirstSearchEverything(this.pathRoot.rowNode, callback, traverseLeafNodes);
    }
  }
  executeFromRootNode(callback) {
    callback(this.pathRoot.rowNode);
  }
  createPathItems(rowNode) {
    let pointer = rowNode;
    let newEntryCount = 0;
    while (!this.mapToItems[pointer.id]) {
      const newEntry = {
        rowNode: pointer,
        children: null
      };
      this.mapToItems[pointer.id] = newEntry;
      newEntryCount++;
      pointer = pointer.parent;
    }
    return newEntryCount;
  }
  populateColumnsMap(rowNode, columns) {
    if (!this.keepingColumns || !columns) {
      return;
    }
    let pointer = rowNode;
    while (pointer) {
      if (!this.nodeIdsToColumns[pointer.id]) {
        this.nodeIdsToColumns[pointer.id] = {};
      }
      columns.forEach(col => this.nodeIdsToColumns[pointer.id][col.getId()] = true);
      pointer = pointer.parent;
    }
  }
  linkPathItems(rowNode, newEntryCount) {
    let pointer = rowNode;
    for (let i = 0; i < newEntryCount; i++) {
      const thisItem = this.mapToItems[pointer.id];
      const parentItem = this.mapToItems[pointer.parent.id];
      if (!parentItem.children) {
        parentItem.children = [];
      }
      parentItem.children.push(thisItem);
      pointer = pointer.parent;
    }
  }
  addParentNode(rowNode, columns) {
    if (!rowNode || rowNode.isRowPinned()) {
      return;
    }
    const newEntryCount = this.createPathItems(rowNode);
    this.linkPathItems(rowNode, newEntryCount);
    this.populateColumnsMap(rowNode, columns);
  }
  canSkip(rowNode) {
    return this.active && !this.mapToItems[rowNode.id];
  }
  getValueColumnsForNode(rowNode, valueColumns) {
    if (!this.keepingColumns) {
      return valueColumns;
    }
    const colsForThisNode = this.nodeIdsToColumns[rowNode.id];
    const result = valueColumns.filter(col => colsForThisNode[col.getId()]);
    return result;
  }
  getNotValueColumnsForNode(rowNode, valueColumns) {
    if (!this.keepingColumns) {
      return null;
    }
    const colsForThisNode = this.nodeIdsToColumns[rowNode.id];
    const result = valueColumns.filter(col => !colsForThisNode[col.getId()]);
    return result;
  }
}
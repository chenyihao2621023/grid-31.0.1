var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, BeanStub, PostConstruct, PreDestroy } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { LazyBlockLoader } from "./lazyBlockLoader";
import { MultiIndexMap } from "./multiIndexMap";
;
export class LazyCache extends BeanStub {
  constructor(store, numberOfRows, storeParams) {
    super();
    this.live = true;
    this.removedNodeCache = new Map();
    this.store = store;
    this.numberOfRows = numberOfRows;
    this.isLastRowKnown = false;
    this.storeParams = storeParams;
  }
  init() {
    this.nodeMap = new MultiIndexMap('index', 'id', 'node');
    this.nodeDisplayIndexMap = new Map();
    this.nodesToRefresh = new Set();
    this.defaultNodeIdPrefix = this.blockUtils.createNodeIdPrefix(this.store.getParentNode());
    this.rowLoader = this.createManagedBean(new LazyBlockLoader(this, this.store.getParentNode(), this.storeParams));
    this.getRowIdFunc = this.gridOptionsService.getCallback('getRowId');
    this.isMasterDetail = this.gridOptionsService.get('masterDetail');
  }
  destroyRowNodes() {
    this.numberOfRows = 0;
    this.nodeMap.forEach(node => this.blockUtils.destroyRowNode(node.node));
    this.nodeMap.clear();
    this.nodeDisplayIndexMap.clear();
    this.nodesToRefresh.clear();
    this.live = false;
  }
  getRowByDisplayIndex(displayIndex) {
    var _a, _b, _c, _d;
    if (!this.store.isDisplayIndexInStore(displayIndex)) {
      return undefined;
    }
    const node = this.nodeDisplayIndexMap.get(displayIndex);
    if (node) {
      if (node.stub || node.__needsRefreshWhenVisible) {
        this.rowLoader.queueLoadCheck();
      }
      return node;
    }
    if (displayIndex === this.store.getDisplayIndexStart()) {
      return this.createStubNode(0, displayIndex);
    }
    const contiguouslyPreviousNode = this.nodeDisplayIndexMap.get(displayIndex - 1);
    if (contiguouslyPreviousNode) {
      if (this.isMasterDetail && contiguouslyPreviousNode.master && contiguouslyPreviousNode.expanded) {
        return contiguouslyPreviousNode.detailNode;
      }
      if (contiguouslyPreviousNode.expanded && ((_a = contiguouslyPreviousNode.childStore) === null || _a === void 0 ? void 0 : _a.isDisplayIndexInStore(displayIndex))) {
        return (_b = contiguouslyPreviousNode.childStore) === null || _b === void 0 ? void 0 : _b.getRowUsingDisplayIndex(displayIndex);
      }
      const lazyCacheNode = this.nodeMap.getBy('node', contiguouslyPreviousNode);
      return this.createStubNode(lazyCacheNode.index + 1, displayIndex);
    }
    const adjacentNodes = this.getSurroundingNodesByDisplayIndex(displayIndex);
    if (adjacentNodes == null) {
      const storeIndexFromEndIndex = this.store.getRowCount() - (this.store.getDisplayIndexEnd() - displayIndex);
      return this.createStubNode(storeIndexFromEndIndex, displayIndex);
    }
    const {
      previousNode,
      nextNode
    } = adjacentNodes;
    if (previousNode && previousNode.node.expanded && ((_c = previousNode.node.childStore) === null || _c === void 0 ? void 0 : _c.isDisplayIndexInStore(displayIndex))) {
      return (_d = previousNode.node.childStore) === null || _d === void 0 ? void 0 : _d.getRowUsingDisplayIndex(displayIndex);
    }
    if (nextNode) {
      const displayIndexDiff = nextNode.node.rowIndex - displayIndex;
      const newStoreIndex = nextNode.index - displayIndexDiff;
      return this.createStubNode(newStoreIndex, displayIndex);
    }
    const storeIndexFromEndIndex = this.store.getRowCount() - (this.store.getDisplayIndexEnd() - displayIndex);
    return this.createStubNode(storeIndexFromEndIndex, displayIndex);
  }
  createStubNode(storeIndex, displayIndex) {
    const rowBounds = this.store.getRowBounds(displayIndex);
    const newNode = this.createRowAtIndex(storeIndex, null, node => {
      node.setRowIndex(displayIndex);
      node.setRowTop(rowBounds.rowTop);
      this.nodeDisplayIndexMap.set(displayIndex, node);
    });
    this.rowLoader.queueLoadCheck();
    return newNode;
  }
  getRowByStoreIndex(index) {
    var _a;
    return (_a = this.nodeMap.getBy('index', index)) === null || _a === void 0 ? void 0 : _a.node;
  }
  skipDisplayIndexes(numberOfRowsToSkip, displayIndexSeq, nextRowTop) {
    if (numberOfRowsToSkip === 0) {
      return;
    }
    const defaultRowHeight = this.gridOptionsService.getRowHeightAsNumber();
    displayIndexSeq.skip(numberOfRowsToSkip);
    nextRowTop.value += numberOfRowsToSkip * defaultRowHeight;
  }
  setDisplayIndexes(displayIndexSeq, nextRowTop) {
    this.nodeDisplayIndexMap.clear();
    const orderedMap = {};
    this.nodeMap.forEach(lazyNode => {
      orderedMap[lazyNode.index] = lazyNode.node;
    });
    let lastIndex = -1;
    for (const stringIndex in orderedMap) {
      const node = orderedMap[stringIndex];
      const numericIndex = Number(stringIndex);
      const numberOfRowsToSkip = numericIndex - 1 - lastIndex;
      this.skipDisplayIndexes(numberOfRowsToSkip, displayIndexSeq, nextRowTop);
      this.blockUtils.setDisplayIndex(node, displayIndexSeq, nextRowTop);
      this.nodeDisplayIndexMap.set(node.rowIndex, node);
      lastIndex = numericIndex;
    }
    const numberOfRowsToSkip = this.numberOfRows - 1 - lastIndex;
    this.skipDisplayIndexes(numberOfRowsToSkip, displayIndexSeq, nextRowTop);
    this.purgeExcessRows();
  }
  getRowCount() {
    return this.numberOfRows;
  }
  setRowCount(rowCount, isLastRowIndexKnown) {
    if (rowCount < 0) {
      throw new Error('ZING Grid: setRowCount can only accept a positive row count.');
    }
    this.numberOfRows = rowCount;
    if (isLastRowIndexKnown != null) {
      this.isLastRowKnown = isLastRowIndexKnown;
      if (isLastRowIndexKnown === false) {
        this.numberOfRows += 1;
      }
    }
    this.fireStoreUpdatedEvent();
  }
  getNodes() {
    return this.nodeMap;
  }
  getNodeCachedByDisplayIndex(displayIndex) {
    var _a;
    return (_a = this.nodeDisplayIndexMap.get(displayIndex)) !== null && _a !== void 0 ? _a : null;
  }
  getNodesToRefresh() {
    return this.nodesToRefresh;
  }
  getSurroundingNodesByDisplayIndex(displayIndex) {
    let nextNode;
    let previousNode;
    this.nodeMap.forEach(lazyNode => {
      if (displayIndex > lazyNode.node.rowIndex) {
        if (previousNode == null || previousNode.node.rowIndex < lazyNode.node.rowIndex) {
          previousNode = lazyNode;
        }
        return;
      }
      if (nextNode == null || nextNode.node.rowIndex > lazyNode.node.rowIndex) {
        nextNode = lazyNode;
        return;
      }
    });
    if (!previousNode && !nextNode) return null;
    return {
      previousNode,
      nextNode
    };
  }
  getDisplayIndexFromStoreIndex(storeIndex) {
    var _a, _b;
    const nodeAtIndex = this.nodeMap.getBy('index', storeIndex);
    if (nodeAtIndex) {
      return nodeAtIndex.node.rowIndex;
    }
    let nextNode;
    let previousNode;
    this.nodeMap.forEach(lazyNode => {
      if (storeIndex > lazyNode.index) {
        if (previousNode == null || previousNode.index < lazyNode.index) {
          previousNode = lazyNode;
        }
        return;
      }
      if (nextNode == null || nextNode.index > lazyNode.index) {
        nextNode = lazyNode;
        return;
      }
    });
    if (!nextNode) {
      return this.store.getDisplayIndexEnd() - (this.numberOfRows - storeIndex);
    }
    if (!previousNode) {
      return this.store.getDisplayIndexStart() + storeIndex;
    }
    const storeIndexDiff = storeIndex - previousNode.index;
    const previousDisplayIndex = (_b = (_a = previousNode.node.childStore) === null || _a === void 0 ? void 0 : _a.getDisplayIndexEnd()) !== null && _b !== void 0 ? _b : previousNode.node.rowIndex;
    return previousDisplayIndex + storeIndexDiff;
  }
  createRowAtIndex(atStoreIndex, data, createNodeCallback) {
    var _a, _b;
    const lazyNode = this.nodeMap.getBy('index', atStoreIndex);
    if (lazyNode) {
      const {
        node
      } = lazyNode;
      node.__needsRefreshWhenVisible = false;
      if (this.doesNodeMatch(data, node)) {
        this.blockUtils.updateDataIntoRowNode(node, data);
        this.nodesToRefresh.delete(node);
        return node;
      }
      if (this.getRowIdFunc == null && node.hasChildren() && node.expanded) {
        this.nodesToRefresh.delete(node);
        return node;
      }
      this.destroyRowAtIndex(atStoreIndex);
    }
    if (data && this.getRowIdFunc != null) {
      const id = this.getRowId(data);
      const deletedNode = id && ((_a = this.removedNodeCache) === null || _a === void 0 ? void 0 : _a.get(id));
      if (deletedNode) {
        (_b = this.removedNodeCache) === null || _b === void 0 ? void 0 : _b.delete(id);
        this.blockUtils.updateDataIntoRowNode(deletedNode, data);
        this.nodeMap.set({
          id: deletedNode.id,
          node: deletedNode,
          index: atStoreIndex
        });
        return deletedNode;
      }
      const lazyNode = this.nodeMap.getBy('id', id);
      if (lazyNode) {
        this.nodeMap.delete(lazyNode);
        const {
          node,
          index
        } = lazyNode;
        this.blockUtils.updateDataIntoRowNode(node, data);
        this.nodeMap.set({
          id: node.id,
          node,
          index: atStoreIndex
        });
        this.nodesToRefresh.delete(node);
        if (this.rowLoader.getBlockStartIndexForIndex(index) === this.rowLoader.getBlockStartIndexForIndex(atStoreIndex)) {
          return node;
        }
        this.markBlockForVerify(index);
        return node;
      }
    }
    const newNode = this.blockUtils.createRowNode(this.store.getRowDetails());
    if (data != null) {
      const defaultId = this.getPrefixedId(this.store.getIdSequence().next());
      this.blockUtils.setDataIntoRowNode(newNode, data, defaultId, undefined);
      this.blockUtils.checkOpenByDefault(newNode);
      this.nodeManager.addRowNode(newNode);
    }
    this.nodeMap.set({
      id: newNode.id,
      node: newNode,
      index: atStoreIndex
    });
    if (createNodeCallback) {
      createNodeCallback(newNode);
    }
    return newNode;
  }
  getBlockStates() {
    const blockCounts = {};
    const blockStates = {};
    this.nodeMap.forEach(({
      node,
      index
    }) => {
      var _a;
      const blockStart = this.rowLoader.getBlockStartIndexForIndex(index);
      if (!node.stub && !node.failedLoad) {
        blockCounts[blockStart] = ((_a = blockCounts[blockStart]) !== null && _a !== void 0 ? _a : 0) + 1;
      }
      let rowState = 'loaded';
      if (node.failedLoad) {
        rowState = 'failed';
      } else if (this.rowLoader.isRowLoading(blockStart)) {
        rowState = 'loading';
      } else if (this.nodesToRefresh.has(node) || node.stub) {
        rowState = 'needsLoading';
      }
      if (!blockStates[blockStart]) {
        blockStates[blockStart] = new Set();
      }
      blockStates[blockStart].add(rowState);
    });
    const statePriorityMap = {
      loading: 4,
      failed: 3,
      needsLoading: 2,
      loaded: 1
    };
    const blockPrefix = this.blockUtils.createNodeIdPrefix(this.store.getParentNode());
    const results = {};
    Object.entries(blockStates).forEach(([blockStart, uniqueStates]) => {
      var _a;
      const sortedStates = [...uniqueStates].sort((a, b) => {
        var _a, _b;
        return ((_a = statePriorityMap[a]) !== null && _a !== void 0 ? _a : 0) - ((_b = statePriorityMap[b]) !== null && _b !== void 0 ? _b : 0);
      });
      const priorityState = sortedStates[0];
      const blockNumber = Number(blockStart) / this.rowLoader.getBlockSize();
      const blockId = blockPrefix ? `${blockPrefix}-${blockNumber}` : String(blockNumber);
      results[blockId] = {
        blockNumber,
        startRow: Number(blockStart),
        endRow: Number(blockStart) + this.rowLoader.getBlockSize(),
        pageStatus: priorityState,
        loadedRowCount: (_a = blockCounts[blockStart]) !== null && _a !== void 0 ? _a : 0
      };
    });
    return results;
  }
  destroyRowAtIndex(atStoreIndex) {
    const lazyNode = this.nodeMap.getBy('index', atStoreIndex);
    if (!lazyNode) {
      return;
    }
    this.nodeMap.delete(lazyNode);
    this.nodeDisplayIndexMap.delete(lazyNode.node.rowIndex);
    if (lazyNode.node.hasChildren() && this.nodesToRefresh.size > 0) {
      this.removedNodeCache.set(lazyNode.node.id, lazyNode.node);
    } else {
      this.blockUtils.destroyRowNode(lazyNode.node);
    }
    this.nodesToRefresh.delete(lazyNode.node);
  }
  getSsrmParams() {
    return this.store.getSsrmParams();
  }
  getPrefixedId(id) {
    if (this.defaultNodeIdPrefix) {
      return this.defaultNodeIdPrefix + '-' + id;
    } else {
      return id.toString();
    }
  }
  markBlockForVerify(rowIndex) {
    const [start, end] = this.rowLoader.getBlockBoundsForIndex(rowIndex);
    const lazyNodesInRange = this.nodeMap.filter(lazyNode => lazyNode.index >= start && lazyNode.index < end);
    lazyNodesInRange.forEach(({
      node
    }) => {
      node.__needsRefreshWhenVisible = true;
    });
  }
  doesNodeMatch(data, node) {
    if (node.stub) {
      return false;
    }
    if (this.getRowIdFunc != null) {
      const id = this.getRowId(data);
      return node.id === id;
    }
    return node.data === data;
  }
  purgeStubsOutsideOfViewport() {
    const firstRow = this.api.getFirstDisplayedRow();
    const lastRow = this.api.getLastDisplayedRow();
    const firstRowBlockStart = this.rowLoader.getBlockStartIndexForIndex(firstRow);
    const [_, lastRowBlockEnd] = this.rowLoader.getBlockBoundsForIndex(lastRow);
    this.nodeMap.forEach(lazyNode => {
      if (this.rowLoader.isRowLoading(lazyNode.index) || lazyNode.node.failedLoad) {
        return;
      }
      if (lazyNode.node.stub && (lazyNode.index < firstRowBlockStart || lazyNode.index > lastRowBlockEnd)) {
        this.destroyRowAtIndex(lazyNode.index);
      }
    });
  }
  getBlocksDistanceFromRow(nodes, otherDisplayIndex) {
    const blockDistanceToMiddle = {};
    nodes.forEach(({
      node,
      index
    }) => {
      const [blockStart, blockEnd] = this.rowLoader.getBlockBoundsForIndex(index);
      if (blockStart in blockDistanceToMiddle) {
        return;
      }
      const distStart = Math.abs(node.rowIndex - otherDisplayIndex);
      let distEnd;
      const lastLazyNode = this.nodeMap.getBy('index', [blockEnd - 1]);
      if (lastLazyNode) distEnd = Math.abs(lastLazyNode.node.rowIndex - otherDisplayIndex);
      const farthest = distEnd == null || distStart < distEnd ? distStart : distEnd;
      blockDistanceToMiddle[blockStart] = farthest;
    });
    return Object.entries(blockDistanceToMiddle);
  }
  purgeExcessRows() {
    var _a;
    this.purgeStubsOutsideOfViewport();
    if (this.store.getDisplayIndexEnd() == null || this.storeParams.maxBlocksInCache == null) {
      return;
    }
    const firstRowInViewport = this.api.getFirstDisplayedRow();
    const lastRowInViewport = this.api.getLastDisplayedRow();
    const allLoadedBlocks = new Set();
    const blocksInViewport = new Set();
    this.nodeMap.forEach(({
      index,
      node
    }) => {
      const blockStart = this.rowLoader.getBlockStartIndexForIndex(index);
      allLoadedBlocks.add(blockStart);
      const isInViewport = node.rowIndex >= firstRowInViewport && node.rowIndex <= lastRowInViewport;
      if (isInViewport) {
        blocksInViewport.add(blockStart);
      }
    });
    const numberOfBlocksToRetain = Math.max(blocksInViewport.size, (_a = this.storeParams.maxBlocksInCache) !== null && _a !== void 0 ? _a : 0);
    const loadedBlockCount = allLoadedBlocks.size;
    const blocksToRemove = loadedBlockCount - numberOfBlocksToRetain;
    if (blocksToRemove <= 0) {
      return;
    }
    let firstRowBlockStart = Number.MAX_SAFE_INTEGER;
    let lastRowBlockStart = Number.MIN_SAFE_INTEGER;
    blocksInViewport.forEach(blockStart => {
      if (firstRowBlockStart > blockStart) {
        firstRowBlockStart = blockStart;
      }
      if (lastRowBlockStart < blockStart) {
        lastRowBlockStart = blockStart;
      }
    });
    const disposableNodes = this.nodeMap.filter(({
      node,
      index
    }) => {
      const rowBlockStart = this.rowLoader.getBlockStartIndexForIndex(index);
      const rowBlockInViewport = rowBlockStart >= firstRowBlockStart && rowBlockStart <= lastRowBlockStart;
      return !rowBlockInViewport && !this.isNodeCached(node);
    });
    if (disposableNodes.length === 0) {
      return;
    }
    const midViewportRow = firstRowInViewport + (lastRowInViewport - firstRowInViewport) / 2;
    const blockDistanceArray = this.getBlocksDistanceFromRow(disposableNodes, midViewportRow);
    const blockSize = this.rowLoader.getBlockSize();
    blockDistanceArray.sort((a, b) => Math.sign(b[1] - a[1]));
    for (let i = 0; i < Math.min(blocksToRemove, blockDistanceArray.length); i++) {
      const blockStart = Number(blockDistanceArray[i][0]);
      for (let x = blockStart; x < blockStart + blockSize; x++) {
        const lazyNode = this.nodeMap.getBy('index', x);
        if (!lazyNode || this.isNodeCached(lazyNode.node)) {
          continue;
        }
        this.destroyRowAtIndex(x);
      }
    }
  }
  isNodeFocused(node) {
    const focusedCell = this.focusService.getFocusCellToUseAfterRefresh();
    if (!focusedCell) {
      return false;
    }
    if (focusedCell.rowPinned != null) {
      return false;
    }
    const hasFocus = focusedCell.rowIndex === node.rowIndex;
    return hasFocus;
  }
  isNodeCached(node) {
    return node.isExpandable() && node.expanded || this.isNodeFocused(node);
  }
  extractDuplicateIds(rows) {
    if (this.getRowIdFunc != null) {
      return [];
    }
    const newIds = new Set();
    const duplicates = new Set();
    rows.forEach(data => {
      const id = this.getRowId(data);
      if (newIds.has(id)) {
        duplicates.add(id);
        return;
      }
      newIds.add(id);
    });
    return [...duplicates];
  }
  onLoadSuccess(firstRowIndex, numberOfRowsExpected, response) {
    if (!this.live) return;
    const info = response.groupLevelInfo;
    this.store.setStoreInfo(info);
    if (this.getRowIdFunc != null) {
      const duplicates = this.extractDuplicateIds(response.rowData);
      if (duplicates.length > 0) {
        const duplicateIdText = duplicates.join(', ');
        console.warn(`ZING Grid: Unable to display rows as duplicate row ids (${duplicateIdText}) were returned by the getRowId callback. Please modify the getRowId callback to provide unique ids.`);
        this.onLoadFailed(firstRowIndex, numberOfRowsExpected);
        return;
      }
    }
    if (response.pivotResultFields) {
      this.serverSideRowModel.generateSecondaryColumns(response.pivotResultFields);
    }
    const wasRefreshing = this.nodesToRefresh.size > 0;
    response.rowData.forEach((data, responseRowIndex) => {
      var _a;
      const rowIndex = firstRowIndex + responseRowIndex;
      const nodeFromCache = this.nodeMap.getBy('index', rowIndex);
      if ((_a = nodeFromCache === null || nodeFromCache === void 0 ? void 0 : nodeFromCache.node) === null || _a === void 0 ? void 0 : _a.stub) {
        this.createRowAtIndex(rowIndex, data);
        return;
      }
      if (nodeFromCache && this.doesNodeMatch(data, nodeFromCache.node)) {
        this.blockUtils.updateDataIntoRowNode(nodeFromCache.node, data);
        this.nodesToRefresh.delete(nodeFromCache.node);
        nodeFromCache.node.__needsRefreshWhenVisible = false;
        return;
      }
      this.createRowAtIndex(rowIndex, data);
    });
    const finishedRefreshing = this.nodesToRefresh.size === 0;
    if (wasRefreshing && finishedRefreshing) {
      this.fireRefreshFinishedEvent();
    }
    if (response.rowCount != undefined && response.rowCount !== -1) {
      this.numberOfRows = response.rowCount;
      this.isLastRowKnown = true;
    } else if (numberOfRowsExpected > response.rowData.length) {
      this.numberOfRows = firstRowIndex + response.rowData.length;
      this.isLastRowKnown = true;
    } else if (!this.isLastRowKnown) {
      const lastInferredRow = firstRowIndex + response.rowData.length + 1;
      if (lastInferredRow > this.numberOfRows) {
        this.numberOfRows = lastInferredRow;
      }
    }
    if (this.isLastRowKnown) {
      const lazyNodesAfterStoreEnd = this.nodeMap.filter(lazyNode => lazyNode.index >= this.numberOfRows);
      lazyNodesAfterStoreEnd.forEach(lazyNode => this.destroyRowAtIndex(lazyNode.index));
    }
    this.fireStoreUpdatedEvent();
  }
  fireRefreshFinishedEvent() {
    const finishedRefreshing = this.nodesToRefresh.size === 0;
    if (!finishedRefreshing) {
      return;
    }
    this.removedNodeCache.forEach(node => {
      this.blockUtils.destroyRowNode(node);
    });
    this.removedNodeCache = new Map();
    this.store.fireRefreshFinishedEvent();
  }
  isLastRowIndexKnown() {
    return this.isLastRowKnown;
  }
  onLoadFailed(firstRowIndex, numberOfRowsExpected) {
    var _a;
    if (!this.live) return;
    const wasRefreshing = this.nodesToRefresh.size > 0;
    for (let i = firstRowIndex; i < firstRowIndex + numberOfRowsExpected && i < this.getRowCount(); i++) {
      let {
        node
      } = (_a = this.nodeMap.getBy('index', i)) !== null && _a !== void 0 ? _a : {};
      if (node) {
        this.nodesToRefresh.delete(node);
      }
      if (!node || !node.stub) {
        if (node && !node.stub) {
          this.destroyRowAtIndex(i);
        }
        node = this.createRowAtIndex(i);
      }
      node.__needsRefreshWhenVisible = false;
      node.failedLoad = true;
    }
    const finishedRefreshing = this.nodesToRefresh.size === 0;
    if (wasRefreshing && finishedRefreshing) {
      this.fireRefreshFinishedEvent();
    }
    this.fireStoreUpdatedEvent();
  }
  markNodesForRefresh() {
    this.nodeMap.forEach(lazyNode => {
      if (lazyNode.node.stub && !lazyNode.node.failedLoad) {
        return;
      }
      this.nodesToRefresh.add(lazyNode.node);
    });
    this.rowLoader.queueLoadCheck();
    if (this.isLastRowKnown && this.numberOfRows === 0) {
      this.numberOfRows = 1;
      this.isLastRowKnown = false;
      this.fireStoreUpdatedEvent();
    }
  }
  isNodeInCache(id) {
    return !!this.nodeMap.getBy('id', id);
  }
  fireStoreUpdatedEvent() {
    if (!this.live) {
      return;
    }
    this.store.fireStoreUpdatedEvent();
  }
  getRowId(data) {
    if (this.getRowIdFunc == null) {
      return null;
    }
    const {
      level
    } = this.store.getRowDetails();
    const parentKeys = this.store.getParentNode().getGroupKeys();
    const id = this.getRowIdFunc({
      data,
      parentKeys: parentKeys.length > 0 ? parentKeys : undefined,
      level
    });
    return String(id);
  }
  updateRowNodes(updates) {
    if (this.getRowIdFunc == null) {
      throw new Error('ZING Grid: Transactions can only be applied when row ids are supplied.');
    }
    const updatedNodes = [];
    updates.forEach(data => {
      const id = this.getRowId(data);
      const lazyNode = this.nodeMap.getBy('id', id);
      if (lazyNode) {
        this.blockUtils.updateDataIntoRowNode(lazyNode.node, data);
        updatedNodes.push(lazyNode.node);
      }
    });
    return updatedNodes;
  }
  insertRowNodes(inserts, indexToAdd) {
    const realRowCount = this.store.getRowCount() - (this.store.getParentNode().sibling ? 1 : 0);
    const addIndex = indexToAdd == null && this.isLastRowKnown ? realRowCount : indexToAdd;
    if (addIndex == null || realRowCount < addIndex) {
      return [];
    }
    if (this.getRowIdFunc == null) {
      throw new Error('ZING Grid: Transactions can only be applied when row ids are supplied.');
    }
    const uniqueInsertsMap = {};
    inserts.forEach(data => {
      const dataId = this.getRowId(data);
      if (dataId && this.isNodeInCache(dataId)) {
        return;
      }
      uniqueInsertsMap[dataId] = data;
    });
    const uniqueInserts = Object.values(uniqueInsertsMap);
    let numberOfInserts = uniqueInserts.length;
    if (numberOfInserts === 0) {
      return [];
    }
    const nodesToMove = this.nodeMap.filter(node => node.index >= addIndex);
    nodesToMove.forEach(lazyNode => this.nodeMap.delete(lazyNode));
    nodesToMove.forEach(lazyNode => {
      this.nodeMap.set({
        node: lazyNode.node,
        index: lazyNode.index + numberOfInserts,
        id: lazyNode.id
      });
    });
    this.numberOfRows += numberOfInserts;
    return uniqueInserts.map((data, uniqueInsertOffset) => this.createRowAtIndex(addIndex + uniqueInsertOffset, data));
  }
  getOrderedNodeMap() {
    const obj = {};
    this.nodeMap.forEach(node => obj[node.index] = node);
    return obj;
  }
  clearDisplayIndexes() {
    this.nodeDisplayIndexMap.clear();
  }
  removeRowNodes(idsToRemove) {
    if (this.getRowIdFunc == null) {
      throw new Error('ZING Grid: Transactions can only be applied when row ids are supplied.');
    }
    const removedNodes = [];
    const nodesToVerify = [];
    let deletedNodeCount = 0;
    const remainingIdsToRemove = [...idsToRemove];
    const allNodes = this.getOrderedNodeMap();
    let contiguousIndex = -1;
    for (let stringIndex in allNodes) {
      contiguousIndex += 1;
      const node = allNodes[stringIndex];
      const matchIndex = remainingIdsToRemove.findIndex(idToRemove => idToRemove === node.id);
      if (matchIndex !== -1) {
        remainingIdsToRemove.splice(matchIndex, 1);
        this.destroyRowAtIndex(Number(stringIndex));
        removedNodes.push(node.node);
        deletedNodeCount += 1;
        continue;
      }
      if (deletedNodeCount === 0) {
        continue;
      }
      const numericStoreIndex = Number(stringIndex);
      if (contiguousIndex !== numericStoreIndex) {
        nodesToVerify.push(node.node);
      }
      this.nodeMap.delete(allNodes[stringIndex]);
      this.nodeMap.set({
        id: node.id,
        node: node.node,
        index: numericStoreIndex - deletedNodeCount
      });
    }
    this.numberOfRows -= this.isLastRowIndexKnown() ? idsToRemove.length : deletedNodeCount;
    if (remainingIdsToRemove.length > 0 && nodesToVerify.length > 0) {
      nodesToVerify.forEach(node => node.__needsRefreshWhenVisible = true);
      this.rowLoader.queueLoadCheck();
    }
    return removedNodes;
  }
}
__decorate([Autowired('gridApi')], LazyCache.prototype, "api", void 0);
__decorate([Autowired('ssrmBlockUtils')], LazyCache.prototype, "blockUtils", void 0);
__decorate([Autowired('focusService')], LazyCache.prototype, "focusService", void 0);
__decorate([Autowired('ssrmNodeManager')], LazyCache.prototype, "nodeManager", void 0);
__decorate([Autowired('rowModel')], LazyCache.prototype, "serverSideRowModel", void 0);
__decorate([PostConstruct], LazyCache.prototype, "init", null);
__decorate([PreDestroy], LazyCache.prototype, "destroyRowNodes", null);
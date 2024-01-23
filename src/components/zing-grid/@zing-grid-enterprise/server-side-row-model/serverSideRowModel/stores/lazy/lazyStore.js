var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, Autowired, BeanStub, Events, NumberSequence, PostConstruct, PreDestroy, ServerSideTransactionResultStatus } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { LazyCache } from "./lazyCache";
export class LazyStore extends BeanStub {
    constructor(ssrmParams, storeParams, parentRowNode) {
        super();
        this.idSequence = new NumberSequence();
        this.ssrmParams = ssrmParams;
        this.parentRowNode = parentRowNode;
        this.storeParams = storeParams;
        this.level = parentRowNode.level + 1;
        this.group = ssrmParams.rowGroupCols ? this.level < ssrmParams.rowGroupCols.length : false;
        this.leafGroup = ssrmParams.rowGroupCols ? this.level === ssrmParams.rowGroupCols.length - 1 : false;
        this.info = {};
    }
    init() {
        var _a;
        let numberOfRows = 1;
        if (this.level === 0) {
            numberOfRows = (_a = this.storeUtils.getServerSideInitialRowCount()) !== null && _a !== void 0 ? _a : 1;
            this.eventService.dispatchEventOnce({
                type: Events.EVENT_ROW_COUNT_READY
            });
        }
        this.cache = this.createManagedBean(new LazyCache(this, numberOfRows, this.storeParams));
        const usingTreeData = this.gridOptionsService.get('treeData');
        if (!usingTreeData && this.group) {
            const groupColVo = this.ssrmParams.rowGroupCols[this.level];
            this.groupField = groupColVo.field;
            this.rowGroupColumn = this.columnModel.getRowGroupColumns()[this.level];
        }
    }
    destroyRowNodes() {
        this.displayIndexStart = undefined;
        this.displayIndexEnd = undefined;
        this.destroyBean(this.cache);
    }
    
    applyRowData(rowDataParams, startRow, expectedRows) {
        this.cache.onLoadSuccess(startRow, expectedRows, rowDataParams);
    }
    
    applyTransaction(transaction) {
        var _a, _b, _c;
        const idFunc = this.gridOptionsService.getCallback('getRowId');
        if (!idFunc) {
            console.warn('ZING Grid: getRowId callback must be implemented for transactions to work. Transaction was ignored.');
            return {
                status: ServerSideTransactionResultStatus.Cancelled,
            };
        }
        const applyCallback = this.gridOptionsService.getCallback('isApplyServerSideTransaction');
        if (applyCallback) {
            const params = {
                transaction: transaction,
                parentNode: this.parentRowNode,
                groupLevelInfo: this.info
            };
            const apply = applyCallback(params);
            if (!apply) {
                return { status: ServerSideTransactionResultStatus.Cancelled };
            }
        }
        let updatedNodes = undefined;
        if ((_a = transaction.update) === null || _a === void 0 ? void 0 : _a.length) {
            updatedNodes = this.cache.updateRowNodes(transaction.update);
        }
        let insertedNodes = undefined;
        if ((_b = transaction.add) === null || _b === void 0 ? void 0 : _b.length) {
            let addIndex = transaction.addIndex;
            if (addIndex != null && addIndex < 0) {
                addIndex = undefined;
            }
            insertedNodes = this.cache.insertRowNodes(transaction.add, addIndex);
        }
        let removedNodes = undefined;
        if ((_c = transaction.remove) === null || _c === void 0 ? void 0 : _c.length) {
            const allIdsToRemove = transaction.remove.map(data => (idFunc({ level: this.level, parentKeys: this.parentRowNode.getGroupKeys(), data })));
            const allUniqueIdsToRemove = [...new Set(allIdsToRemove)];
            removedNodes = this.cache.removeRowNodes(allUniqueIdsToRemove);
        }
        this.updateSelectionAfterTransaction(updatedNodes, removedNodes);
        return {
            status: ServerSideTransactionResultStatus.Applied,
            update: updatedNodes,
            add: insertedNodes,
            remove: removedNodes,
        };
    }
    updateSelectionAfterTransaction(updatedNodes, removedNodes) {
        const nodesToDeselect = [];
        updatedNodes === null || updatedNodes === void 0 ? void 0 : updatedNodes.forEach(node => {
            if (node.isSelected() && !node.selectable) {
                nodesToDeselect.push(node);
            }
        });
        removedNodes === null || removedNodes === void 0 ? void 0 : removedNodes.forEach(node => {
            if (node.isSelected()) {
                nodesToDeselect.push(node);
            }
        });
        if (nodesToDeselect.length) {
            this.selectionService.setNodesSelected({
                newValue: false,
                clearSelection: false,
                nodes: nodesToDeselect,
                source: 'rowDataChanged',
            });
        }
    }
    
    clearDisplayIndexes() {
        this.displayIndexStart = undefined;
        this.displayIndexEnd = undefined;
        this.cache.getNodes().forEach(lazyNode => this.blockUtils.clearDisplayIndex(lazyNode.node));
        if (this.parentRowNode.sibling) {
            this.blockUtils.clearDisplayIndex(this.parentRowNode.sibling);
        }
        this.cache.clearDisplayIndexes();
    }
    
    getDisplayIndexStart() {
        return this.displayIndexStart;
    }
    
    getDisplayIndexEnd() {
        return this.displayIndexEnd;
    }
    
    getRowCount() {
        if (this.parentRowNode.sibling) {
            return this.cache.getRowCount() + 1;
        }
        return this.cache.getRowCount();
    }
    
    setRowCount(rowCount, isLastRowIndexKnown) {
        this.cache.setRowCount(rowCount, isLastRowIndexKnown);
    }
    
    isDisplayIndexInStore(displayIndex) {
        if (this.cache.getRowCount() === 0)
            return false;
        return this.displayIndexStart <= displayIndex && displayIndex < this.getDisplayIndexEnd();
    }
    
    setDisplayIndexes(displayIndexSeq, nextRowTop) {
        this.displayIndexStart = displayIndexSeq.peek();
        this.topPx = nextRowTop.value;
        // delegate to the store to set the row display indexes
        this.cache.setDisplayIndexes(displayIndexSeq, nextRowTop);
        if (this.parentRowNode.sibling) {
            this.blockUtils.setDisplayIndex(this.parentRowNode.sibling, displayIndexSeq, nextRowTop);
        }
        this.displayIndexEnd = displayIndexSeq.peek();
        this.heightPx = nextRowTop.value - this.topPx;
    }
    
    forEachStoreDeep(callback, sequence = new NumberSequence()) {
        callback(this, sequence.next());
        this.cache.getNodes().forEach(lazyNode => {
            const childCache = lazyNode.node.childStore;
            if (childCache) {
                childCache.forEachStoreDeep(callback, sequence);
            }
        });
    }
    
    forEachNodeDeep(callback, sequence = new NumberSequence()) {
        this.cache.getNodes().forEach(lazyNode => {
            callback(lazyNode.node, sequence.next());
            const childCache = lazyNode.node.childStore;
            if (childCache) {
                childCache.forEachNodeDeep(callback, sequence);
            }
        });
    }
    
    forEachNodeDeepAfterFilterAndSort(callback, sequence = new NumberSequence(), includeFooterNodes = false) {
        const orderedNodes = this.cache.getOrderedNodeMap();
        for (let key in orderedNodes) {
            const lazyNode = orderedNodes[key];
            callback(lazyNode.node, sequence.next());
            const childCache = lazyNode.node.childStore;
            if (childCache) {
                childCache.forEachNodeDeepAfterFilterAndSort(callback, sequence, includeFooterNodes);
            }
        }
        if (includeFooterNodes && this.parentRowNode.sibling) {
            callback(this.parentRowNode.sibling, sequence.next());
        }
    }
    
    retryLoads() {
        this.cache.getNodes().forEach(({ node }) => {
            if (node.failedLoad) {
                node.failedLoad = false;
                node.__needsRefreshWhenVisible = true;
                node.stub = true;
            }
        });
        this.forEachChildStoreShallow(store => store.retryLoads());
        this.fireStoreUpdatedEvent();
    }
    
    getRowUsingDisplayIndex(displayRowIndex) {
        if (this.parentRowNode.sibling && displayRowIndex === this.parentRowNode.sibling.rowIndex) {
            return this.parentRowNode.sibling;
        }
        return this.cache.getRowByDisplayIndex(displayRowIndex);
    }
    
    getRowBounds(displayIndex) {
        var _a;
        if (!this.isDisplayIndexInStore(displayIndex)) {
            return null;
        }
        const thisNode = this.cache.getNodeCachedByDisplayIndex(displayIndex);
        if (thisNode) {
            const boundsFromRow = this.blockUtils.extractRowBounds(thisNode, displayIndex);
            if (boundsFromRow) {
                return boundsFromRow;
            }
        }
        const { previousNode, nextNode } = (_a = this.cache.getSurroundingNodesByDisplayIndex(displayIndex)) !== null && _a !== void 0 ? _a : {};
        // previous node may equal, or catch via detail node or child of group
        if (previousNode) {
            const boundsFromRow = this.blockUtils.extractRowBounds(previousNode.node, displayIndex);
            if (boundsFromRow != null) {
                return boundsFromRow;
            }
        }
        const defaultRowHeight = this.gridOptionsService.getRowHeightAsNumber();
        // if node after this, can calculate backwards (and ignore detail/grouping)
        if (nextNode) {
            const numberOfRowDiff = (nextNode.node.rowIndex - displayIndex) * defaultRowHeight;
            return {
                rowTop: nextNode.node.rowTop - numberOfRowDiff,
                rowHeight: defaultRowHeight,
            };
        }
        // otherwise calculate from end of store
        const lastTop = this.topPx + this.heightPx;
        const numberOfRowDiff = (this.getDisplayIndexEnd() - displayIndex) * defaultRowHeight;
        return {
            rowTop: lastTop - numberOfRowDiff,
            rowHeight: defaultRowHeight,
        };
    }
    
    isPixelInRange(pixel) {
        return pixel >= this.topPx && pixel < (this.topPx + this.heightPx);
    }
    
    getRowIndexAtPixel(pixel) {
        if (pixel < this.topPx) {
            return this.getDisplayIndexStart();
        }
        if (pixel >= this.topPx + this.heightPx) {
            return this.getDisplayIndexEnd() - 1;
        }
        let distToPreviousNodeTop = Number.MAX_SAFE_INTEGER;
        let previousNode = null;
        let distToNextNodeTop = Number.MAX_SAFE_INTEGER;
        let nextNode = null;
        this.cache.getNodes().forEach(({ node }) => {
            const distBetween = Math.abs(pixel - node.rowTop);
            // previous node
            if (node.rowTop < pixel) {
                if (distBetween < distToPreviousNodeTop) {
                    distToPreviousNodeTop = distBetween;
                    previousNode = node;
                }
                return;
            }
            // next node
            if (distBetween < distToNextNodeTop) {
                distToNextNodeTop = distBetween;
                nextNode = node;
            }
        });
        // cast these back as typescript doesn't understand the forEach above
        previousNode = previousNode;
        nextNode = nextNode;
        // previous node may equal, or catch via detail node or child of group
        if (previousNode) {
            const indexOfRow = this.blockUtils.getIndexAtPixel(previousNode, pixel);
            if (indexOfRow != null) {
                return indexOfRow;
            }
        }
        const defaultRowHeight = this.gridOptionsService.getRowHeightAsNumber();
        // if node after this, can calculate backwards (and ignore detail/grouping)
        if (nextNode) {
            const nextTop = nextNode.rowTop;
            const numberOfRowDiff = Math.ceil((nextTop - pixel) / defaultRowHeight);
            return nextNode.rowIndex - numberOfRowDiff;
        }
        // otherwise calculate from end of store
        const nextTop = this.topPx + this.heightPx;
        const numberOfRowDiff = Math.floor((nextTop - pixel) / defaultRowHeight);
        return this.getDisplayIndexEnd() - numberOfRowDiff;
    }
    
    getChildStore(keys) {
        return this.storeUtils.getChildStore(keys, this, (key) => {
            const lazyNode = this.cache.getNodes().find(lazyNode => lazyNode.node.key == key);
            if (!lazyNode) {
                return null;
            }
            return lazyNode.node;
        });
    }
    
    forEachChildStoreShallow(cb) {
        this.cache.getNodes().forEach(({ node }) => {
            if (node.childStore) {
                cb(node.childStore);
            }
        });
    }
    
    refreshAfterSort(params) {
        const serverSortsAllLevels = this.storeUtils.isServerSideSortAllLevels();
        if (serverSortsAllLevels || this.storeUtils.isServerRefreshNeeded(this.parentRowNode, this.ssrmParams.rowGroupCols, params)) {
            const oldCount = this.cache.getRowCount();
            this.destroyBean(this.cache);
            this.cache = this.createManagedBean(new LazyCache(this, oldCount, this.storeParams));
            this.fireStoreUpdatedEvent();
            return;
        }
        // call refreshAfterSort on children, as we did not purge.
        // if we did purge, no need to do this as all children were destroyed
        this.forEachChildStoreShallow(store => store.refreshAfterSort(params));
    }
    
    refreshAfterFilter(params) {
        const serverFiltersAllLevels = !this.storeUtils.isServerSideOnlyRefreshFilteredGroups();
        if (serverFiltersAllLevels || this.storeUtils.isServerRefreshNeeded(this.parentRowNode, this.ssrmParams.rowGroupCols, params)) {
            this.refreshStore(true);
            return;
        }
        // call refreshAfterSort on children, as we did not purge.
        // if we did purge, no need to do this as all children were destroyed
        this.forEachChildStoreShallow(store => store.refreshAfterFilter(params));
    }
    
    refreshStore(purge) {
        if (purge) {
            this.destroyBean(this.cache);
            this.cache = this.createManagedBean(new LazyCache(this, 1, this.storeParams));
            this.fireStoreUpdatedEvent();
            return;
        }
        this.cache.markNodesForRefresh();
    }
    
    getTopLevelRowDisplayedIndex(topLevelIndex) {
        const displayIndex = this.cache.getDisplayIndexFromStoreIndex(topLevelIndex);
        return displayIndex !== null && displayIndex !== void 0 ? displayIndex : topLevelIndex;
    }
    
    isLastRowIndexKnown() {
        return this.cache.isLastRowIndexKnown();
    }
    
    getRowNodesInRange(firstInRange, lastInRange) {
        const result = [];
        let inActiveRange = false;
        // if only one node passed, we start the selection at the top
        if (_.missing(firstInRange)) {
            inActiveRange = true;
        }
        return this.cache.getNodes().filter(({ node }) => {
            return node.rowIndex >= firstInRange.rowIndex && node.rowIndex <= lastInRange.rowIndex;
        }).map(({ node }) => node);
    }
    
    addStoreStates(result) {
        result.push({
            suppressInfiniteScroll: false,
            route: this.parentRowNode.getGroupKeys(),
            rowCount: this.getRowCount(),
            lastRowIndexKnown: this.isLastRowIndexKnown(),
            info: this.info,
            maxBlocksInCache: this.storeParams.maxBlocksInCache,
            cacheBlockSize: this.storeParams.cacheBlockSize,
        });
        this.forEachChildStoreShallow(childStore => childStore.addStoreStates(result));
    }
    getIdSequence() {
        return this.idSequence;
    }
    getParentNode() {
        return this.parentRowNode;
    }
    getRowDetails() {
        return {
            field: this.groupField,
            group: this.group,
            leafGroup: this.leafGroup,
            level: this.level,
            parent: this.parentRowNode,
            rowGroupColumn: this.rowGroupColumn,
        };
    }
    getSsrmParams() {
        return this.ssrmParams;
    }
    setStoreInfo(info) {
        if (info) {
            Object.assign(this.info, info);
        }
    }
    // gets called 1) row count changed 2) cache purged
    fireStoreUpdatedEvent() {
        // this results in row model firing ModelUpdated.
        // server side row model also updates the row indexes first
        const event = {
            type: Events.EVENT_STORE_UPDATED
        };
        this.eventService.dispatchEvent(event);
    }
    // gets called when row data updated, and no more refreshing needed
    fireRefreshFinishedEvent() {
        const event = {
            type: Events.EVENT_STORE_REFRESHED,
            route: this.parentRowNode.getRoute(),
        };
        this.eventService.dispatchEvent(event);
    }
    getBlockStates() {
        return this.cache.getBlockStates();
    }
    getStoreBounds() {
        return {
            topPx: this.topPx,
            heightPx: this.heightPx,
        };
    }
}
__decorate([
    Autowired('ssrmBlockUtils')
], LazyStore.prototype, "blockUtils", void 0);
__decorate([
    Autowired('ssrmStoreUtils')
], LazyStore.prototype, "storeUtils", void 0);
__decorate([
    Autowired('columnModel')
], LazyStore.prototype, "columnModel", void 0);
__decorate([
    Autowired('selectionService')
], LazyStore.prototype, "selectionService", void 0);
__decorate([
    PostConstruct
], LazyStore.prototype, "init", null);
__decorate([
    PreDestroy
], LazyStore.prototype, "destroyRowNodes", null);

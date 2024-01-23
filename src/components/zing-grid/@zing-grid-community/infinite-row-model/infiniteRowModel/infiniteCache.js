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
import { Autowired, BeanStub, Events, NumberSequence, PreDestroy, Qualifier, _ } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { InfiniteBlock } from "./infiniteBlock";
export class InfiniteCache extends BeanStub {
  constructor(params) {
    super();
    this.lastRowIndexKnown = false;
    this.blocks = {};
    this.blockCount = 0;
    this.rowCount = params.initialRowCount;
    this.params = params;
  }
  setBeans(loggerFactory) {
    this.logger = loggerFactory.create('InfiniteCache');
  }
  getRow(rowIndex, dontCreatePage = false) {
    const blockId = Math.floor(rowIndex / this.params.blockSize);
    let block = this.blocks[blockId];
    if (!block) {
      if (dontCreatePage) {
        return undefined;
      }
      block = this.createBlock(blockId);
    }
    return block.getRow(rowIndex);
  }
  createBlock(blockNumber) {
    const newBlock = this.createBean(new InfiniteBlock(blockNumber, this, this.params));
    this.blocks[newBlock.getId()] = newBlock;
    this.blockCount++;
    this.purgeBlocksIfNeeded(newBlock);
    this.params.rowNodeBlockLoader.addBlock(newBlock);
    return newBlock;
  }
  refreshCache() {
    const nothingToRefresh = this.blockCount == 0;
    if (nothingToRefresh) {
      this.purgeCache();
      return;
    }
    this.getBlocksInOrder().forEach(block => block.setStateWaitingToLoad());
    this.params.rowNodeBlockLoader.checkBlockToLoad();
  }
  destroyAllBlocks() {
    this.getBlocksInOrder().forEach(block => this.destroyBlock(block));
  }
  getRowCount() {
    return this.rowCount;
  }
  isLastRowIndexKnown() {
    return this.lastRowIndexKnown;
  }
  pageLoaded(block, lastRow) {
    if (!this.isAlive()) {
      return;
    }
    this.logger.log(`onPageLoaded: page = ${block.getId()}, lastRow = ${lastRow}`);
    this.checkRowCount(block, lastRow);
    this.onCacheUpdated();
  }
  purgeBlocksIfNeeded(blockToExclude) {
    const blocksForPurging = this.getBlocksInOrder().filter(b => b != blockToExclude);
    const lastAccessedComparator = (a, b) => b.getLastAccessed() - a.getLastAccessed();
    blocksForPurging.sort(lastAccessedComparator);
    const maxBlocksProvided = this.params.maxBlocksInCache > 0;
    const blocksToKeep = maxBlocksProvided ? this.params.maxBlocksInCache - 1 : null;
    const emptyBlocksToKeep = InfiniteCache.MAX_EMPTY_BLOCKS_TO_KEEP - 1;
    blocksForPurging.forEach((block, index) => {
      const purgeBecauseBlockEmpty = block.getState() === InfiniteBlock.STATE_WAITING_TO_LOAD && index >= emptyBlocksToKeep;
      const purgeBecauseCacheFull = maxBlocksProvided ? index >= blocksToKeep : false;
      if (purgeBecauseBlockEmpty || purgeBecauseCacheFull) {
        if (this.isBlockCurrentlyDisplayed(block)) {
          return;
        }
        if (this.isBlockFocused(block)) {
          return;
        }
        this.removeBlockFromCache(block);
      }
    });
  }
  isBlockFocused(block) {
    const focusedCell = this.focusService.getFocusCellToUseAfterRefresh();
    if (!focusedCell) {
      return false;
    }
    if (focusedCell.rowPinned != null) {
      return false;
    }
    const blockIndexStart = block.getStartRow();
    const blockIndexEnd = block.getEndRow();
    const hasFocus = focusedCell.rowIndex >= blockIndexStart && focusedCell.rowIndex < blockIndexEnd;
    return hasFocus;
  }
  isBlockCurrentlyDisplayed(block) {
    const startIndex = block.getStartRow();
    const endIndex = block.getEndRow() - 1;
    return this.rowRenderer.isRangeInRenderedViewport(startIndex, endIndex);
  }
  removeBlockFromCache(blockToRemove) {
    if (!blockToRemove) {
      return;
    }
    this.destroyBlock(blockToRemove);
  }
  checkRowCount(block, lastRow) {
    if (typeof lastRow === 'number' && lastRow >= 0) {
      this.rowCount = lastRow;
      this.lastRowIndexKnown = true;
    } else if (!this.lastRowIndexKnown) {
      const lastRowIndex = (block.getId() + 1) * this.params.blockSize;
      const lastRowIndexPlusOverflow = lastRowIndex + this.params.overflowSize;
      if (this.rowCount < lastRowIndexPlusOverflow) {
        this.rowCount = lastRowIndexPlusOverflow;
      }
    }
  }
  setRowCount(rowCount, lastRowIndexKnown) {
    this.rowCount = rowCount;
    if (_.exists(lastRowIndexKnown)) {
      this.lastRowIndexKnown = lastRowIndexKnown;
    }
    if (!this.lastRowIndexKnown) {
      if (this.rowCount % this.params.blockSize === 0) {
        this.rowCount++;
      }
    }
    this.onCacheUpdated();
  }
  forEachNodeDeep(callback) {
    const sequence = new NumberSequence();
    this.getBlocksInOrder().forEach(block => block.forEachNode(callback, sequence, this.rowCount));
  }
  getBlocksInOrder() {
    const blockComparator = (a, b) => a.getId() - b.getId();
    const blocks = _.getAllValuesInObject(this.blocks).sort(blockComparator);
    return blocks;
  }
  destroyBlock(block) {
    delete this.blocks[block.getId()];
    this.destroyBean(block);
    this.blockCount--;
    this.params.rowNodeBlockLoader.removeBlock(block);
  }
  onCacheUpdated() {
    if (this.isAlive()) {
      this.destroyAllBlocksPastVirtualRowCount();
      const event = {
        type: Events.EVENT_STORE_UPDATED
      };
      this.eventService.dispatchEvent(event);
    }
  }
  destroyAllBlocksPastVirtualRowCount() {
    const blocksToDestroy = [];
    this.getBlocksInOrder().forEach(block => {
      const startRow = block.getId() * this.params.blockSize;
      if (startRow >= this.rowCount) {
        blocksToDestroy.push(block);
      }
    });
    if (blocksToDestroy.length > 0) {
      blocksToDestroy.forEach(block => this.destroyBlock(block));
    }
  }
  purgeCache() {
    this.getBlocksInOrder().forEach(block => this.removeBlockFromCache(block));
    this.lastRowIndexKnown = false;
    if (this.rowCount === 0) {
      this.rowCount = this.params.initialRowCount;
    }
    this.onCacheUpdated();
  }
  getRowNodesInRange(firstInRange, lastInRange) {
    const result = [];
    let lastBlockId = -1;
    let inActiveRange = false;
    const numberSequence = new NumberSequence();
    if (_.missing(firstInRange)) {
      inActiveRange = true;
    }
    let foundGapInSelection = false;
    this.getBlocksInOrder().forEach(block => {
      if (foundGapInSelection) {
        return;
      }
      if (inActiveRange && lastBlockId + 1 !== block.getId()) {
        foundGapInSelection = true;
        return;
      }
      lastBlockId = block.getId();
      block.forEachNode(rowNode => {
        const hitFirstOrLast = rowNode === firstInRange || rowNode === lastInRange;
        if (inActiveRange || hitFirstOrLast) {
          result.push(rowNode);
        }
        if (hitFirstOrLast) {
          inActiveRange = !inActiveRange;
        }
      }, numberSequence, this.rowCount);
    });
    const invalidRange = foundGapInSelection || inActiveRange;
    return invalidRange ? [] : result;
  }
}
InfiniteCache.MAX_EMPTY_BLOCKS_TO_KEEP = 2;
__decorate([Autowired('rowRenderer')], InfiniteCache.prototype, "rowRenderer", void 0);
__decorate([Autowired("focusService")], InfiniteCache.prototype, "focusService", void 0);
__decorate([__param(0, Qualifier('loggerFactory'))], InfiniteCache.prototype, "setBeans", null);
__decorate([PreDestroy], InfiniteCache.prototype, "destroyAllBlocks", null);
var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Bean, Optional, PostConstruct } from "../context/context";
import { BeanStub } from "../context/beanStub";
import { exists, missing } from "../utils/generic";
import { last } from "../utils/array";
import { KeyCode } from '../constants/keyCode';
import { CellCtrl } from "../rendering/cell/cellCtrl";
import { RowCtrl } from "../rendering/row/rowCtrl";
import { warnOnce, throttle } from "../utils/function";
import { Events } from "../eventKeys";
let NavigationService = class NavigationService extends BeanStub {
  constructor() {
    super();
    this.onPageDown = throttle(this.onPageDown, 100);
    this.onPageUp = throttle(this.onPageUp, 100);
  }
  postConstruct() {
    this.ctrlsService.whenReady(p => {
      this.gridBodyCon = p.gridBodyCtrl;
    });
  }
  handlePageScrollingKey(event, fromFullWidth = false) {
    const key = event.key;
    const alt = event.altKey;
    const ctrl = event.ctrlKey || event.metaKey;
    const rangeServiceShouldHandleShift = !!this.rangeService && event.shiftKey;
    const currentCell = this.mouseEventService.getCellPositionForEvent(event);
    let processed = false;
    switch (key) {
      case KeyCode.PAGE_HOME:
      case KeyCode.PAGE_END:
        if (!ctrl && !alt) {
          this.onHomeOrEndKey(key);
          processed = true;
        }
        break;
      case KeyCode.LEFT:
      case KeyCode.RIGHT:
      case KeyCode.UP:
      case KeyCode.DOWN:
        if (!currentCell) {
          return false;
        }
        if (ctrl && !alt && !rangeServiceShouldHandleShift) {
          this.onCtrlUpDownLeftRight(key, currentCell);
          processed = true;
        }
        break;
      case KeyCode.PAGE_DOWN:
      case KeyCode.PAGE_UP:
        if (!ctrl && !alt) {
          processed = this.handlePageUpDown(key, currentCell, fromFullWidth);
        }
        break;
    }
    if (processed) {
      event.preventDefault();
    }
    return processed;
  }
  handlePageUpDown(key, currentCell, fromFullWidth) {
    if (fromFullWidth) {
      currentCell = this.focusService.getFocusedCell();
    }
    if (!currentCell) {
      return false;
    }
    if (key === KeyCode.PAGE_UP) {
      this.onPageUp(currentCell);
    } else {
      this.onPageDown(currentCell);
    }
    return true;
  }
  navigateTo(navigateParams) {
    const {
      scrollIndex,
      scrollType,
      scrollColumn,
      focusIndex,
      focusColumn
    } = navigateParams;
    if (exists(scrollColumn) && !scrollColumn.isPinned()) {
      this.gridBodyCon.getScrollFeature().ensureColumnVisible(scrollColumn);
    }
    if (exists(scrollIndex)) {
      this.gridBodyCon.getScrollFeature().ensureIndexVisible(scrollIndex, scrollType);
    }
    if (!navigateParams.isAsync) {
      this.gridBodyCon.getScrollFeature().ensureIndexVisible(focusIndex);
    }
    this.focusService.setFocusedCell({
      rowIndex: focusIndex,
      column: focusColumn,
      rowPinned: null,
      forceBrowserFocus: true
    });
    if (this.rangeService) {
      const cellPosition = {
        rowIndex: focusIndex,
        rowPinned: null,
        column: focusColumn
      };
      this.rangeService.setRangeToCell(cellPosition);
    }
  }
  onPageDown(gridCell) {
    const gridBodyCon = this.ctrlsService.getGridBodyCtrl();
    const scrollPosition = gridBodyCon.getScrollFeature().getVScrollPosition();
    const pixelsInOnePage = this.getViewportHeight();
    const pagingPixelOffset = this.paginationProxy.getPixelOffset();
    const currentPageBottomPixel = scrollPosition.top + pixelsInOnePage;
    const currentPageBottomRow = this.paginationProxy.getRowIndexAtPixel(currentPageBottomPixel + pagingPixelOffset);
    if (this.columnModel.isAutoRowHeightActive()) {
      this.navigateToNextPageWithAutoHeight(gridCell, currentPageBottomRow);
    } else {
      this.navigateToNextPage(gridCell, currentPageBottomRow);
    }
  }
  onPageUp(gridCell) {
    const gridBodyCon = this.ctrlsService.getGridBodyCtrl();
    const scrollPosition = gridBodyCon.getScrollFeature().getVScrollPosition();
    const pagingPixelOffset = this.paginationProxy.getPixelOffset();
    const currentPageTopPixel = scrollPosition.top;
    const currentPageTopRow = this.paginationProxy.getRowIndexAtPixel(currentPageTopPixel + pagingPixelOffset);
    if (this.columnModel.isAutoRowHeightActive()) {
      this.navigateToNextPageWithAutoHeight(gridCell, currentPageTopRow, true);
    } else {
      this.navigateToNextPage(gridCell, currentPageTopRow, true);
    }
  }
  navigateToNextPage(gridCell, scrollIndex, up = false) {
    const pixelsInOnePage = this.getViewportHeight();
    const firstRow = this.paginationProxy.getPageFirstRow();
    const lastRow = this.paginationProxy.getPageLastRow();
    const pagingPixelOffset = this.paginationProxy.getPixelOffset();
    const currentRowNode = this.paginationProxy.getRow(gridCell.rowIndex);
    const rowPixelDiff = up ? (currentRowNode === null || currentRowNode === void 0 ? void 0 : currentRowNode.rowHeight) - pixelsInOnePage - pagingPixelOffset : pixelsInOnePage - pagingPixelOffset;
    const nextCellPixel = (currentRowNode === null || currentRowNode === void 0 ? void 0 : currentRowNode.rowTop) + rowPixelDiff;
    let focusIndex = this.paginationProxy.getRowIndexAtPixel(nextCellPixel + pagingPixelOffset);
    if (focusIndex === gridCell.rowIndex) {
      const diff = up ? -1 : 1;
      scrollIndex = focusIndex = gridCell.rowIndex + diff;
    }
    let scrollType;
    if (up) {
      scrollType = 'bottom';
      if (focusIndex < firstRow) {
        focusIndex = firstRow;
      }
      if (scrollIndex < firstRow) {
        scrollIndex = firstRow;
      }
    } else {
      scrollType = 'top';
      if (focusIndex > lastRow) {
        focusIndex = lastRow;
      }
      if (scrollIndex > lastRow) {
        scrollIndex = lastRow;
      }
    }
    if (this.isRowTallerThanView(focusIndex)) {
      scrollIndex = focusIndex;
      scrollType = 'top';
    }
    this.navigateTo({
      scrollIndex,
      scrollType,
      scrollColumn: null,
      focusIndex,
      focusColumn: gridCell.column
    });
  }
  navigateToNextPageWithAutoHeight(gridCell, scrollIndex, up = false) {
    this.navigateTo({
      scrollIndex: scrollIndex,
      scrollType: up ? 'bottom' : 'top',
      scrollColumn: null,
      focusIndex: scrollIndex,
      focusColumn: gridCell.column
    });
    setTimeout(() => {
      const focusIndex = this.getNextFocusIndexForAutoHeight(gridCell, up);
      this.navigateTo({
        scrollIndex: scrollIndex,
        scrollType: up ? 'bottom' : 'top',
        scrollColumn: null,
        focusIndex: focusIndex,
        focusColumn: gridCell.column,
        isAsync: true
      });
    }, 50);
  }
  getNextFocusIndexForAutoHeight(gridCell, up = false) {
    var _a;
    const step = up ? -1 : 1;
    const pixelsInOnePage = this.getViewportHeight();
    const lastRowIndex = this.paginationProxy.getPageLastRow();
    let pixelSum = 0;
    let currentIndex = gridCell.rowIndex;
    while (currentIndex >= 0 && currentIndex <= lastRowIndex) {
      const currentCell = this.paginationProxy.getRow(currentIndex);
      if (currentCell) {
        const currentCellHeight = (_a = currentCell.rowHeight) !== null && _a !== void 0 ? _a : 0;
        if (pixelSum + currentCellHeight > pixelsInOnePage) {
          break;
        }
        pixelSum += currentCellHeight;
      }
      currentIndex += step;
    }
    return Math.max(0, Math.min(currentIndex, lastRowIndex));
  }
  getViewportHeight() {
    const gridBodyCon = this.ctrlsService.getGridBodyCtrl();
    const scrollPosition = gridBodyCon.getScrollFeature().getVScrollPosition();
    const scrollbarWidth = this.gridOptionsService.getScrollbarWidth();
    let pixelsInOnePage = scrollPosition.bottom - scrollPosition.top;
    if (this.ctrlsService.getCenterRowContainerCtrl().isHorizontalScrollShowing()) {
      pixelsInOnePage -= scrollbarWidth;
    }
    return pixelsInOnePage;
  }
  isRowTallerThanView(rowIndex) {
    const rowNode = this.paginationProxy.getRow(rowIndex);
    if (!rowNode) {
      return false;
    }
    const rowHeight = rowNode.rowHeight;
    if (typeof rowHeight !== 'number') {
      return false;
    }
    return rowHeight > this.getViewportHeight();
  }
  onCtrlUpDownLeftRight(key, gridCell) {
    const cellToFocus = this.cellNavigationService.getNextCellToFocus(key, gridCell, true);
    const {
      rowIndex,
      column
    } = cellToFocus;
    this.navigateTo({
      scrollIndex: rowIndex,
      scrollType: null,
      scrollColumn: column,
      focusIndex: rowIndex,
      focusColumn: column
    });
  }
  onHomeOrEndKey(key) {
    const homeKey = key === KeyCode.PAGE_HOME;
    const allColumns = this.columnModel.getAllDisplayedColumns();
    const columnToSelect = homeKey ? allColumns[0] : last(allColumns);
    const scrollIndex = homeKey ? this.paginationProxy.getPageFirstRow() : this.paginationProxy.getPageLastRow();
    this.navigateTo({
      scrollIndex: scrollIndex,
      scrollType: null,
      scrollColumn: columnToSelect,
      focusIndex: scrollIndex,
      focusColumn: columnToSelect
    });
  }
  onTabKeyDown(previous, keyboardEvent) {
    const backwards = keyboardEvent.shiftKey;
    const movedToNextCell = this.tabToNextCellCommon(previous, backwards, keyboardEvent);
    if (movedToNextCell) {
      keyboardEvent.preventDefault();
      return;
    }
    if (backwards) {
      const {
        rowIndex,
        rowPinned
      } = previous.getRowPosition();
      const firstRow = rowPinned ? rowIndex === 0 : rowIndex === this.paginationProxy.getPageFirstRow();
      if (firstRow) {
        if (this.gridOptionsService.get('headerHeight') === 0) {
          this.focusService.focusNextGridCoreContainer(true, true);
        } else {
          keyboardEvent.preventDefault();
          this.focusService.focusPreviousFromFirstCell(keyboardEvent);
        }
      }
    } else {
      if (previous instanceof CellCtrl) {
        previous.focusCell(true);
      }
      if (this.focusService.focusNextGridCoreContainer(backwards)) {
        keyboardEvent.preventDefault();
      }
    }
  }
  tabToNextCell(backwards, event) {
    const focusedCell = this.focusService.getFocusedCell();
    if (!focusedCell) {
      return false;
    }
    let cellOrRow = this.getCellByPosition(focusedCell);
    if (!cellOrRow) {
      cellOrRow = this.rowRenderer.getRowByPosition(focusedCell);
      if (!cellOrRow || !cellOrRow.isFullWidth()) {
        return false;
      }
    }
    return this.tabToNextCellCommon(cellOrRow, backwards, event);
  }
  tabToNextCellCommon(previous, backwards, event) {
    let editing = previous.isEditing();
    if (!editing && previous instanceof CellCtrl) {
      const cell = previous;
      const row = cell.getRowCtrl();
      if (row) {
        editing = row.isEditing();
      }
    }
    let res;
    if (editing) {
      if (this.gridOptionsService.get('editType') === 'fullRow') {
        res = this.moveToNextEditingRow(previous, backwards, event);
      } else {
        res = this.moveToNextEditingCell(previous, backwards, event);
      }
    } else {
      res = this.moveToNextCellNotEditing(previous, backwards);
    }
    return res || !!this.focusService.getFocusedHeader();
  }
  moveToNextEditingCell(previousCell, backwards, event = null) {
    const previousPos = previousCell.getCellPosition();
    previousCell.getGui().focus();
    previousCell.stopEditing();
    const nextCell = this.findNextCellToFocusOn(previousPos, backwards, true);
    if (nextCell == null) {
      return false;
    }
    nextCell.startEditing(null, true, event);
    nextCell.focusCell(false);
    return true;
  }
  moveToNextEditingRow(previousCell, backwards, event = null) {
    const previousPos = previousCell.getCellPosition();
    const nextCell = this.findNextCellToFocusOn(previousPos, backwards, true);
    if (nextCell == null) {
      return false;
    }
    const nextPos = nextCell.getCellPosition();
    const previousEditable = this.isCellEditable(previousPos);
    const nextEditable = this.isCellEditable(nextPos);
    const rowsMatch = nextPos && previousPos.rowIndex === nextPos.rowIndex && previousPos.rowPinned === nextPos.rowPinned;
    if (previousEditable) {
      previousCell.setFocusOutOnEditor();
    }
    if (!rowsMatch) {
      const pRow = previousCell.getRowCtrl();
      pRow.stopEditing();
      const nRow = nextCell.getRowCtrl();
      nRow.startRowEditing(undefined, undefined, event);
    }
    if (nextEditable) {
      nextCell.setFocusInOnEditor();
      nextCell.focusCell();
    } else {
      nextCell.focusCell(true);
    }
    return true;
  }
  moveToNextCellNotEditing(previousCell, backwards) {
    const displayedColumns = this.columnModel.getAllDisplayedColumns();
    let cellPos;
    if (previousCell instanceof RowCtrl) {
      cellPos = Object.assign(Object.assign({}, previousCell.getRowPosition()), {
        column: backwards ? displayedColumns[0] : last(displayedColumns)
      });
    } else {
      cellPos = previousCell.getCellPosition();
    }
    const nextCell = this.findNextCellToFocusOn(cellPos, backwards, false);
    if (nextCell instanceof CellCtrl) {
      nextCell.focusCell(true);
    } else if (nextCell) {
      return this.tryToFocusFullWidthRow(nextCell.getRowPosition(), backwards);
    }
    return exists(nextCell);
  }
  findNextCellToFocusOn(previousPosition, backwards, startEditing) {
    let nextPosition = previousPosition;
    while (true) {
      if (previousPosition !== nextPosition) {
        previousPosition = nextPosition;
      }
      if (!backwards) {
        nextPosition = this.getLastCellOfColSpan(nextPosition);
      }
      nextPosition = this.cellNavigationService.getNextTabbedCell(nextPosition, backwards);
      const userFunc = this.gridOptionsService.getCallback('tabToNextCell');
      if (exists(userFunc)) {
        const params = {
          backwards: backwards,
          editing: startEditing,
          previousCellPosition: previousPosition,
          nextCellPosition: nextPosition ? nextPosition : null
        };
        const userCell = userFunc(params);
        if (exists(userCell)) {
          if (userCell.floating) {
            warnOnce(`tabToNextCellFunc return type should have attributes: rowIndex, rowPinned, column. However you had 'floating', maybe you meant 'rowPinned'?`);
            userCell.rowPinned = userCell.floating;
          }
          nextPosition = {
            rowIndex: userCell.rowIndex,
            column: userCell.column,
            rowPinned: userCell.rowPinned
          };
        } else {
          nextPosition = null;
        }
      }
      if (!nextPosition) {
        return null;
      }
      if (nextPosition.rowIndex < 0) {
        const headerLen = this.headerNavigationService.getHeaderRowCount();
        this.focusService.focusHeaderPosition({
          headerPosition: {
            headerRowIndex: headerLen + nextPosition.rowIndex,
            column: nextPosition.column
          },
          fromCell: true
        });
        return null;
      }
      const fullRowEdit = this.gridOptionsService.get('editType') === 'fullRow';
      if (startEditing && !fullRowEdit) {
        const cellIsEditable = this.isCellEditable(nextPosition);
        if (!cellIsEditable) {
          continue;
        }
      }
      this.ensureCellVisible(nextPosition);
      const nextCell = this.getCellByPosition(nextPosition);
      if (!nextCell) {
        const row = this.rowRenderer.getRowByPosition(nextPosition);
        if (!row || !row.isFullWidth() || startEditing) {
          continue;
        }
        return row;
      }
      if (nextCell.isSuppressNavigable()) {
        continue;
      }
      if (this.rangeService) {
        this.rangeService.setRangeToCell(nextPosition);
      }
      return nextCell;
    }
  }
  isCellEditable(cell) {
    const rowNode = this.lookupRowNodeForCell(cell);
    if (rowNode) {
      return cell.column.isCellEditable(rowNode);
    }
    return false;
  }
  getCellByPosition(cellPosition) {
    const rowCtrl = this.rowRenderer.getRowByPosition(cellPosition);
    if (!rowCtrl) {
      return null;
    }
    return rowCtrl.getCellCtrl(cellPosition.column);
  }
  lookupRowNodeForCell(cell) {
    if (cell.rowPinned === 'top') {
      return this.pinnedRowModel.getPinnedTopRow(cell.rowIndex);
    }
    if (cell.rowPinned === 'bottom') {
      return this.pinnedRowModel.getPinnedBottomRow(cell.rowIndex);
    }
    return this.paginationProxy.getRow(cell.rowIndex);
  }
  navigateToNextCell(event, key, currentCell, allowUserOverride) {
    let nextCell = currentCell;
    let hitEdgeOfGrid = false;
    while (nextCell && (nextCell === currentCell || !this.isValidNavigateCell(nextCell))) {
      if (this.gridOptionsService.get('enableRtl')) {
        if (key === KeyCode.LEFT) {
          nextCell = this.getLastCellOfColSpan(nextCell);
        }
      } else if (key === KeyCode.RIGHT) {
        nextCell = this.getLastCellOfColSpan(nextCell);
      }
      nextCell = this.cellNavigationService.getNextCellToFocus(key, nextCell);
      hitEdgeOfGrid = missing(nextCell);
    }
    if (hitEdgeOfGrid && event && event.key === KeyCode.UP) {
      nextCell = {
        rowIndex: -1,
        rowPinned: null,
        column: currentCell.column
      };
    }
    if (allowUserOverride) {
      const userFunc = this.gridOptionsService.getCallback('navigateToNextCell');
      if (exists(userFunc)) {
        const params = {
          key: key,
          previousCellPosition: currentCell,
          nextCellPosition: nextCell ? nextCell : null,
          event: event
        };
        const userCell = userFunc(params);
        if (exists(userCell)) {
          if (userCell.floating) {
            warnOnce(`tabToNextCellFunc return type should have attributes: rowIndex, rowPinned, column. However you had 'floating', maybe you meant 'rowPinned'?`);
            userCell.rowPinned = userCell.floating;
          }
          nextCell = {
            rowPinned: userCell.rowPinned,
            rowIndex: userCell.rowIndex,
            column: userCell.column
          };
        } else {
          nextCell = null;
        }
      }
    }
    if (!nextCell) {
      return;
    }
    if (nextCell.rowIndex < 0) {
      const headerLen = this.headerNavigationService.getHeaderRowCount();
      this.focusService.focusHeaderPosition({
        headerPosition: {
          headerRowIndex: headerLen + nextCell.rowIndex,
          column: currentCell.column
        },
        event: event || undefined,
        fromCell: true
      });
      return;
    }
    const normalisedPosition = this.getNormalisedPosition(nextCell);
    if (normalisedPosition) {
      this.focusPosition(normalisedPosition);
    } else {
      this.tryToFocusFullWidthRow(nextCell);
    }
  }
  getNormalisedPosition(cellPosition) {
    this.ensureCellVisible(cellPosition);
    const cellCtrl = this.getCellByPosition(cellPosition);
    if (!cellCtrl) {
      return null;
    }
    cellPosition = cellCtrl.getCellPosition();
    this.ensureCellVisible(cellPosition);
    return cellPosition;
  }
  tryToFocusFullWidthRow(position, backwards = false) {
    const displayedColumns = this.columnModel.getAllDisplayedColumns();
    const rowComp = this.rowRenderer.getRowByPosition(position);
    if (!rowComp || !rowComp.isFullWidth()) {
      return false;
    }
    const currentCellFocused = this.focusService.getFocusedCell();
    const cellPosition = {
      rowIndex: position.rowIndex,
      rowPinned: position.rowPinned,
      column: position.column || (backwards ? last(displayedColumns) : displayedColumns[0])
    };
    this.focusPosition(cellPosition);
    const fromBelow = currentCellFocused != null ? this.rowPositionUtils.before(cellPosition, currentCellFocused) : false;
    const focusEvent = {
      type: Events.EVENT_FULL_WIDTH_ROW_FOCUSED,
      rowIndex: cellPosition.rowIndex,
      rowPinned: cellPosition.rowPinned,
      column: cellPosition.column,
      isFullWidthCell: true,
      floating: cellPosition.rowPinned,
      fromBelow
    };
    this.eventService.dispatchEvent(focusEvent);
    return true;
  }
  focusPosition(cellPosition) {
    this.focusService.setFocusedCell({
      rowIndex: cellPosition.rowIndex,
      column: cellPosition.column,
      rowPinned: cellPosition.rowPinned,
      forceBrowserFocus: true
    });
    if (this.rangeService) {
      this.rangeService.setRangeToCell(cellPosition);
    }
  }
  isValidNavigateCell(cell) {
    const rowNode = this.rowPositionUtils.getRowNode(cell);
    return !!rowNode;
  }
  getLastCellOfColSpan(cell) {
    const cellCtrl = this.getCellByPosition(cell);
    if (!cellCtrl) {
      return cell;
    }
    const colSpanningList = cellCtrl.getColSpanningList();
    if (colSpanningList.length === 1) {
      return cell;
    }
    return {
      rowIndex: cell.rowIndex,
      column: last(colSpanningList),
      rowPinned: cell.rowPinned
    };
  }
  ensureCellVisible(gridCell) {
    const isGroupStickyEnabled = this.gridOptionsService.isGroupRowsSticky();
    const rowNode = this.rowModel.getRow(gridCell.rowIndex);
    const skipScrollToRow = isGroupStickyEnabled && (rowNode === null || rowNode === void 0 ? void 0 : rowNode.sticky);
    if (!skipScrollToRow && missing(gridCell.rowPinned)) {
      this.gridBodyCon.getScrollFeature().ensureIndexVisible(gridCell.rowIndex);
    }
    if (!gridCell.column.isPinned()) {
      this.gridBodyCon.getScrollFeature().ensureColumnVisible(gridCell.column);
    }
  }
};
__decorate([Autowired('mouseEventService')], NavigationService.prototype, "mouseEventService", void 0);
__decorate([Autowired('paginationProxy')], NavigationService.prototype, "paginationProxy", void 0);
__decorate([Autowired('focusService')], NavigationService.prototype, "focusService", void 0);
__decorate([Optional('rangeService')], NavigationService.prototype, "rangeService", void 0);
__decorate([Autowired('columnModel')], NavigationService.prototype, "columnModel", void 0);
__decorate([Autowired('rowModel')], NavigationService.prototype, "rowModel", void 0);
__decorate([Autowired('ctrlsService')], NavigationService.prototype, "ctrlsService", void 0);
__decorate([Autowired('rowRenderer')], NavigationService.prototype, "rowRenderer", void 0);
__decorate([Autowired('headerNavigationService')], NavigationService.prototype, "headerNavigationService", void 0);
__decorate([Autowired("rowPositionUtils")], NavigationService.prototype, "rowPositionUtils", void 0);
__decorate([Autowired("cellNavigationService")], NavigationService.prototype, "cellNavigationService", void 0);
__decorate([Autowired("pinnedRowModel")], NavigationService.prototype, "pinnedRowModel", void 0);
__decorate([PostConstruct], NavigationService.prototype, "postConstruct", null);
NavigationService = __decorate([Bean('navigationService')], NavigationService);
export { NavigationService };
var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ClipboardService_1;
import { _, Autowired, Bean, BeanStub, ChangedPath, Events, PostConstruct, Optional } from "@/components/zing-grid/@zing-grid-community/core/main.js";
const SOURCE_PASTE = 'paste';
const EXPORT_TYPE_DRAG_COPY = 'dragCopy';
const EXPORT_TYPE_CLIPBOARD = 'clipboard';
var CellClearType;
(function (CellClearType) {
  CellClearType[CellClearType["CellRange"] = 0] = "CellRange";
  CellClearType[CellClearType["SelectedRows"] = 1] = "SelectedRows";
  CellClearType[CellClearType["FocusedCell"] = 2] = "FocusedCell";
})(CellClearType || (CellClearType = {}));
;
const apiError = method => `ZING Grid: Unable to use the Clipboard API (navigator.clipboard.${method}()). ` + 'The reason why it could not be used has been logged in the previous line. ' + 'For this reason the grid has defaulted to using a workaround which doesn\'t perform as well. ' + 'Either fix why Clipboard API is blocked, OR stop this message from appearing by setting grid ' + 'property suppressClipboardApi=true (which will default the grid to using the workaround rather than the API.';
let ClipboardService = ClipboardService_1 = class ClipboardService extends BeanStub {
  constructor() {
    super(...arguments);
    this.lastPasteOperationTime = 0;
    this.navigatorApiFailed = false;
  }
  init() {
    this.logger = this.loggerFactory.create('ClipboardService');
    if (this.rowModel.getType() === 'clientSide') {
      this.clientSideRowModel = this.rowModel;
    }
    this.ctrlsService.whenReady(p => {
      this.gridCtrl = p.gridCtrl;
    });
  }
  pasteFromClipboard() {
    this.logger.log('pasteFromClipboard');
    const allowNavigator = !this.gridOptionsService.get('suppressClipboardApi');
    if (allowNavigator && !this.navigatorApiFailed && navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(this.processClipboardData.bind(this)).catch(e => {
        _.doOnce(() => {
          console.warn(e);
          console.warn(apiError('readText'));
        }, 'clipboardApiError');
        this.navigatorApiFailed = true;
        this.pasteFromClipboardLegacy();
      });
    } else {
      this.pasteFromClipboardLegacy();
    }
  }
  pasteFromClipboardLegacy() {
    let defaultPrevented = false;
    const handlePasteEvent = e => {
      const currentPastOperationTime = new Date().getTime();
      if (currentPastOperationTime - this.lastPasteOperationTime < 50) {
        defaultPrevented = true;
        e.preventDefault();
      }
      this.lastPasteOperationTime = currentPastOperationTime;
    };
    this.executeOnTempElement(textArea => {
      textArea.addEventListener('paste', handlePasteEvent);
      textArea.focus({
        preventScroll: true
      });
    }, element => {
      const data = element.value;
      if (!defaultPrevented) {
        this.processClipboardData(data);
      } else {
        this.refocusLastFocusedCell();
      }
      element.removeEventListener('paste', handlePasteEvent);
    });
  }
  refocusLastFocusedCell() {
    const focusedCell = this.focusService.getFocusedCell();
    if (focusedCell) {
      this.focusService.setFocusedCell({
        rowIndex: focusedCell.rowIndex,
        column: focusedCell.column,
        rowPinned: focusedCell.rowPinned,
        forceBrowserFocus: true
      });
    }
  }
  getClipboardDelimiter() {
    const delimiter = this.gridOptionsService.get('clipboardDelimiter');
    return _.exists(delimiter) ? delimiter : '\t';
  }
  processClipboardData(data) {
    if (data == null) {
      return;
    }
    let parsedData = ClipboardService_1.stringToArray(data, this.getClipboardDelimiter());
    const userFunc = this.gridOptionsService.getCallback('processDataFromClipboard');
    if (userFunc) {
      parsedData = userFunc({
        data: parsedData
      });
    }
    if (parsedData == null) {
      return;
    }
    if (this.gridOptionsService.get('suppressLastEmptyLineOnPaste')) {
      this.removeLastLineIfBlank(parsedData);
    }
    const pasteOperation = (cellsToFlash, updatedRowNodes, focusedCell, changedPath) => {
      const rangeActive = this.rangeService && this.rangeService.isMoreThanOneCell();
      const pasteIntoRange = rangeActive && !this.hasOnlyOneValueToPaste(parsedData);
      if (pasteIntoRange) {
        this.pasteIntoActiveRange(parsedData, cellsToFlash, updatedRowNodes, changedPath);
      } else {
        this.pasteStartingFromFocusedCell(parsedData, cellsToFlash, updatedRowNodes, focusedCell, changedPath);
      }
    };
    this.doPasteOperation(pasteOperation);
  }
  static stringToArray(strData, delimiter = ',') {
    const data = [];
    const isNewline = char => char === '\r' || char === '\n';
    let insideQuotedField = false;
    if (strData === '') {
      return [['']];
    }
    for (let row = 0, column = 0, position = 0; position < strData.length; position++) {
      const previousChar = strData[position - 1];
      const currentChar = strData[position];
      const nextChar = strData[position + 1];
      const ensureDataExists = () => {
        if (!data[row]) {
          data[row] = [];
        }
        if (!data[row][column]) {
          data[row][column] = '';
        }
      };
      ensureDataExists();
      if (currentChar === '"') {
        if (insideQuotedField) {
          if (nextChar === '"') {
            data[row][column] += '"';
            position++;
          } else {
            insideQuotedField = false;
          }
        } else if (previousChar === undefined || previousChar === delimiter || isNewline(previousChar)) {
          insideQuotedField = true;
        }
      }
      if (!insideQuotedField && currentChar !== '"') {
        if (currentChar === delimiter) {
          column++;
          ensureDataExists();
          continue;
        } else if (isNewline(currentChar)) {
          column = 0;
          row++;
          ensureDataExists();
          if (currentChar === '\r' && nextChar === '\n') {
            position++;
          }
          continue;
        }
      }
      data[row][column] += currentChar;
    }
    return data;
  }
  doPasteOperation(pasteOperationFunc) {
    const api = this.gridOptionsService.api;
    const columnApi = this.gridOptionsService.columnApi;
    const source = 'clipboard';
    this.eventService.dispatchEvent({
      type: Events.EVENT_PASTE_START,
      api,
      columnApi,
      source
    });
    let changedPath;
    if (this.clientSideRowModel) {
      const onlyChangedColumns = this.gridOptionsService.get('aggregateOnlyChangedColumns');
      changedPath = new ChangedPath(onlyChangedColumns, this.clientSideRowModel.getRootNode());
    }
    const cellsToFlash = {};
    const updatedRowNodes = [];
    const focusedCell = this.focusService.getFocusedCell();
    pasteOperationFunc(cellsToFlash, updatedRowNodes, focusedCell, changedPath);
    const nodesToRefresh = [...updatedRowNodes];
    if (changedPath) {
      this.clientSideRowModel.doAggregate(changedPath);
      changedPath.forEachChangedNodeDepthFirst(rowNode => {
        nodesToRefresh.push(rowNode);
      });
    }
    this.rowRenderer.refreshCells({
      rowNodes: nodesToRefresh
    });
    this.dispatchFlashCells(cellsToFlash);
    this.fireRowChanged(updatedRowNodes);
    this.refocusLastFocusedCell();
    const event = {
      type: Events.EVENT_PASTE_END,
      source
    };
    this.eventService.dispatchEvent(event);
  }
  pasteIntoActiveRange(clipboardData, cellsToFlash, updatedRowNodes, changedPath) {
    const abortRepeatingPasteIntoRows = this.getRangeSize() % clipboardData.length != 0;
    let indexOffset = 0;
    let dataRowIndex = 0;
    const rowCallback = (currentRow, rowNode, columns, index) => {
      const atEndOfClipboardData = index - indexOffset >= clipboardData.length;
      if (atEndOfClipboardData) {
        if (abortRepeatingPasteIntoRows) {
          return;
        }
        indexOffset += dataRowIndex;
        dataRowIndex = 0;
      }
      const currentRowData = clipboardData[index - indexOffset];
      updatedRowNodes.push(rowNode);
      const processCellFromClipboardFunc = this.gridOptionsService.getCallback('processCellFromClipboard');
      columns.forEach((column, idx) => {
        if (!column.isCellEditable(rowNode) || column.isSuppressPaste(rowNode)) {
          return;
        }
        if (idx >= currentRowData.length) {
          idx = idx % currentRowData.length;
        }
        const newValue = this.processCell(rowNode, column, currentRowData[idx], EXPORT_TYPE_DRAG_COPY, processCellFromClipboardFunc, true);
        rowNode.setDataValue(column, newValue, SOURCE_PASTE);
        if (changedPath) {
          changedPath.addParentNode(rowNode.parent, [column]);
        }
        const {
          rowIndex,
          rowPinned
        } = currentRow;
        const cellId = this.cellPositionUtils.createIdFromValues({
          rowIndex,
          column,
          rowPinned
        });
        cellsToFlash[cellId] = true;
      });
      dataRowIndex++;
    };
    this.iterateActiveRanges(false, rowCallback);
  }
  pasteStartingFromFocusedCell(parsedData, cellsToFlash, updatedRowNodes, focusedCell, changedPath) {
    if (!focusedCell) {
      return;
    }
    const currentRow = {
      rowIndex: focusedCell.rowIndex,
      rowPinned: focusedCell.rowPinned
    };
    const columnsToPasteInto = this.columnModel.getDisplayedColumnsStartingAt(focusedCell.column);
    if (this.isPasteSingleValueIntoRange(parsedData)) {
      this.pasteSingleValueIntoRange(parsedData, updatedRowNodes, cellsToFlash, changedPath);
    } else {
      this.pasteMultipleValues(parsedData, currentRow, updatedRowNodes, columnsToPasteInto, cellsToFlash, EXPORT_TYPE_CLIPBOARD, changedPath);
    }
  }
  isPasteSingleValueIntoRange(parsedData) {
    return this.hasOnlyOneValueToPaste(parsedData) && this.rangeService != null && !this.rangeService.isEmpty();
  }
  pasteSingleValueIntoRange(parsedData, updatedRowNodes, cellsToFlash, changedPath) {
    const value = parsedData[0][0];
    const rowCallback = (currentRow, rowNode, columns) => {
      updatedRowNodes.push(rowNode);
      columns.forEach(column => this.updateCellValue(rowNode, column, value, cellsToFlash, EXPORT_TYPE_CLIPBOARD, changedPath));
    };
    this.iterateActiveRanges(false, rowCallback);
  }
  hasOnlyOneValueToPaste(parsedData) {
    return parsedData.length === 1 && parsedData[0].length === 1;
  }
  copyRangeDown() {
    if (!this.rangeService || this.rangeService.isEmpty()) {
      return;
    }
    const firstRowValues = [];
    const pasteOperation = (cellsToFlash, updatedRowNodes, focusedCell, changedPath) => {
      const processCellForClipboardFunc = this.gridOptionsService.getCallback('processCellForClipboard');
      const processCellFromClipboardFunc = this.gridOptionsService.getCallback('processCellFromClipboard');
      const rowCallback = (currentRow, rowNode, columns) => {
        if (!firstRowValues.length) {
          columns.forEach(column => {
            const value = this.processCell(rowNode, column, this.valueService.getValue(column, rowNode), EXPORT_TYPE_DRAG_COPY, processCellForClipboardFunc, false, true);
            firstRowValues.push(value);
          });
        } else {
          updatedRowNodes.push(rowNode);
          columns.forEach((column, index) => {
            if (!column.isCellEditable(rowNode) || column.isSuppressPaste(rowNode)) {
              return;
            }
            const firstRowValue = this.processCell(rowNode, column, firstRowValues[index], EXPORT_TYPE_DRAG_COPY, processCellFromClipboardFunc, true);
            rowNode.setDataValue(column, firstRowValue, SOURCE_PASTE);
            if (changedPath) {
              changedPath.addParentNode(rowNode.parent, [column]);
            }
            const {
              rowIndex,
              rowPinned
            } = currentRow;
            const cellId = this.cellPositionUtils.createIdFromValues({
              rowIndex,
              column,
              rowPinned
            });
            cellsToFlash[cellId] = true;
          });
        }
      };
      this.iterateActiveRanges(true, rowCallback);
    };
    this.doPasteOperation(pasteOperation);
  }
  removeLastLineIfBlank(parsedData) {
    const lastLine = _.last(parsedData);
    const lastLineIsBlank = lastLine && lastLine.length === 1 && lastLine[0] === '';
    if (lastLineIsBlank) {
      if (parsedData.length === 1) {
        return;
      }
      _.removeFromArray(parsedData, lastLine);
    }
  }
  fireRowChanged(rowNodes) {
    if (this.gridOptionsService.get('editType') !== 'fullRow') {
      return;
    }
    rowNodes.forEach(rowNode => {
      const event = {
        type: Events.EVENT_ROW_VALUE_CHANGED,
        node: rowNode,
        data: rowNode.data,
        rowIndex: rowNode.rowIndex,
        rowPinned: rowNode.rowPinned
      };
      this.eventService.dispatchEvent(event);
    });
  }
  pasteMultipleValues(clipboardGridData, currentRow, updatedRowNodes, columnsToPasteInto, cellsToFlash, type, changedPath) {
    let rowPointer = currentRow;
    const skipGroupRows = this.clientSideRowModel != null && !this.gridOptionsService.get('enableGroupEdit') && !this.gridOptionsService.get('treeData');
    const getNextGoodRowNode = () => {
      while (true) {
        if (!rowPointer) {
          return null;
        }
        const res = this.rowPositionUtils.getRowNode(rowPointer);
        rowPointer = this.cellNavigationService.getRowBelow({
          rowPinned: rowPointer.rowPinned,
          rowIndex: rowPointer.rowIndex
        });
        if (res == null) {
          return null;
        }
        const skipRow = res.detail || res.footer || skipGroupRows && res.group;
        if (!skipRow) {
          return res;
        }
      }
    };
    clipboardGridData.forEach(clipboardRowData => {
      const rowNode = getNextGoodRowNode();
      if (!rowNode) {
        return;
      }
      clipboardRowData.forEach((value, index) => this.updateCellValue(rowNode, columnsToPasteInto[index], value, cellsToFlash, type, changedPath));
      updatedRowNodes.push(rowNode);
    });
  }
  updateCellValue(rowNode, column, value, cellsToFlash, type, changedPath) {
    if (!rowNode || !column || !column.isCellEditable(rowNode) || column.isSuppressPaste(rowNode)) {
      return;
    }
    if (rowNode.group && column.isValueActive()) {
      return;
    }
    const processedValue = this.processCell(rowNode, column, value, type, this.gridOptionsService.getCallback('processCellFromClipboard'), true);
    rowNode.setDataValue(column, processedValue, SOURCE_PASTE);
    const {
      rowIndex,
      rowPinned
    } = rowNode;
    const cellId = this.cellPositionUtils.createIdFromValues({
      rowIndex: rowIndex,
      column,
      rowPinned
    });
    cellsToFlash[cellId] = true;
    if (changedPath) {
      changedPath.addParentNode(rowNode.parent, [column]);
    }
  }
  copyToClipboard(params = {}) {
    this.copyOrCutToClipboard(params);
  }
  cutToClipboard(params = {}, source = 'api') {
    if (this.gridOptionsService.get('suppressCutToClipboard')) {
      return;
    }
    const startEvent = {
      type: Events.EVENT_CUT_START,
      source
    };
    this.eventService.dispatchEvent(startEvent);
    this.copyOrCutToClipboard(params, true);
    const endEvent = {
      type: Events.EVENT_CUT_END,
      source
    };
    this.eventService.dispatchEvent(endEvent);
  }
  copyOrCutToClipboard(params, cut) {
    let {
      includeHeaders,
      includeGroupHeaders
    } = params;
    this.logger.log(`copyToClipboard: includeHeaders = ${includeHeaders}`);
    if (includeHeaders == null) {
      includeHeaders = this.gridOptionsService.get('copyHeadersToClipboard');
    }
    if (includeGroupHeaders == null) {
      includeGroupHeaders = this.gridOptionsService.get('copyGroupHeadersToClipboard');
    }
    const copyParams = {
      includeHeaders,
      includeGroupHeaders
    };
    const shouldCopyRows = !this.gridOptionsService.get('suppressCopyRowsToClipboard');
    let cellClearType = null;
    if (this.rangeService && !this.rangeService.isEmpty() && !this.shouldSkipSingleCellRange()) {
      this.copySelectedRangeToClipboard(copyParams);
      cellClearType = CellClearType.CellRange;
    } else if (shouldCopyRows && !this.selectionService.isEmpty()) {
      this.copySelectedRowsToClipboard(copyParams);
      cellClearType = CellClearType.SelectedRows;
    } else if (this.focusService.isAnyCellFocused()) {
      this.copyFocusedCellToClipboard(copyParams);
      cellClearType = CellClearType.FocusedCell;
    }
    if (cut && cellClearType !== null) {
      this.clearCellsAfterCopy(cellClearType);
    }
  }
  clearCellsAfterCopy(type) {
    this.eventService.dispatchEvent({
      type: Events.EVENT_KEY_SHORTCUT_CHANGED_CELL_START
    });
    if (type === CellClearType.CellRange) {
      this.rangeService.clearCellRangeCellValues({
        cellEventSource: 'clipboardService'
      });
    } else if (type === CellClearType.SelectedRows) {
      this.clearSelectedRows();
    } else {
      const focusedCell = this.focusService.getFocusedCell();
      if (focusedCell == null) {
        return;
      }
      const rowNode = this.rowPositionUtils.getRowNode(focusedCell);
      if (rowNode) {
        this.clearCellValue(rowNode, focusedCell.column);
      }
    }
    this.eventService.dispatchEvent({
      type: Events.EVENT_KEY_SHORTCUT_CHANGED_CELL_END
    });
  }
  clearSelectedRows() {
    const selected = this.selectionService.getSelectedNodes();
    const columns = this.columnModel.getAllDisplayedColumns();
    for (const row of selected) {
      for (const col of columns) {
        this.clearCellValue(row, col);
      }
    }
  }
  clearCellValue(rowNode, column) {
    if (!column.isCellEditable(rowNode)) {
      return;
    }
    rowNode.setDataValue(column, null, 'clipboardService');
  }
  shouldSkipSingleCellRange() {
    return this.gridOptionsService.get('suppressCopySingleCellRanges') && !this.rangeService.isMoreThanOneCell();
  }
  iterateActiveRanges(onlyFirst, rowCallback, columnCallback) {
    if (!this.rangeService || this.rangeService.isEmpty()) {
      return;
    }
    const cellRanges = this.rangeService.getCellRanges();
    if (onlyFirst) {
      this.iterateActiveRange(cellRanges[0], rowCallback, columnCallback, true);
    } else {
      cellRanges.forEach((range, idx) => this.iterateActiveRange(range, rowCallback, columnCallback, idx === cellRanges.length - 1));
    }
  }
  iterateActiveRange(range, rowCallback, columnCallback, isLastRange) {
    if (!this.rangeService) {
      return;
    }
    let currentRow = this.rangeService.getRangeStartRow(range);
    const lastRow = this.rangeService.getRangeEndRow(range);
    if (columnCallback && range.columns) {
      columnCallback(range.columns);
    }
    let rangeIndex = 0;
    let isLastRow = false;
    while (!isLastRow && currentRow != null) {
      const rowNode = this.rowPositionUtils.getRowNode(currentRow);
      isLastRow = this.rowPositionUtils.sameRow(currentRow, lastRow);
      rowCallback(currentRow, rowNode, range.columns, rangeIndex++, isLastRow && isLastRange);
      currentRow = this.cellNavigationService.getRowBelow(currentRow);
    }
  }
  copySelectedRangeToClipboard(params = {}) {
    if (!this.rangeService || this.rangeService.isEmpty()) {
      return;
    }
    const allRangesMerge = this.rangeService.areAllRangesAbleToMerge();
    const {
      data,
      cellsToFlash
    } = allRangesMerge ? this.buildDataFromMergedRanges(params) : this.buildDataFromRanges(params);
    this.copyDataToClipboard(data);
    this.dispatchFlashCells(cellsToFlash);
  }
  buildDataFromMergedRanges(params) {
    const columnsSet = new Set();
    const ranges = this.rangeService.getCellRanges();
    const rowPositionsMap = new Map();
    const allRowPositions = [];
    const allCellsToFlash = {};
    ranges.forEach(range => {
      range.columns.forEach(col => columnsSet.add(col));
      const {
        rowPositions,
        cellsToFlash
      } = this.getRangeRowPositionsAndCellsToFlash(range);
      rowPositions.forEach(rowPosition => {
        const rowPositionAsString = `${rowPosition.rowIndex}-${rowPosition.rowPinned || 'null'}`;
        if (!rowPositionsMap.get(rowPositionAsString)) {
          rowPositionsMap.set(rowPositionAsString, true);
          allRowPositions.push(rowPosition);
        }
      });
      Object.assign(allCellsToFlash, cellsToFlash);
    });
    const allColumns = this.columnModel.getAllDisplayedColumns();
    const exportedColumns = Array.from(columnsSet);
    exportedColumns.sort((a, b) => {
      const posA = allColumns.indexOf(a);
      const posB = allColumns.indexOf(b);
      return posA - posB;
    });
    const data = this.buildExportParams({
      columns: exportedColumns,
      rowPositions: allRowPositions,
      includeHeaders: params.includeHeaders,
      includeGroupHeaders: params.includeGroupHeaders
    });
    return {
      data,
      cellsToFlash: allCellsToFlash
    };
  }
  buildDataFromRanges(params) {
    const ranges = this.rangeService.getCellRanges();
    const data = [];
    const allCellsToFlash = {};
    ranges.forEach(range => {
      const {
        rowPositions,
        cellsToFlash
      } = this.getRangeRowPositionsAndCellsToFlash(range);
      Object.assign(allCellsToFlash, cellsToFlash);
      data.push(this.buildExportParams({
        columns: range.columns,
        rowPositions: rowPositions,
        includeHeaders: params.includeHeaders,
        includeGroupHeaders: params.includeGroupHeaders
      }));
    });
    return {
      data: data.join('\n'),
      cellsToFlash: allCellsToFlash
    };
  }
  getRangeRowPositionsAndCellsToFlash(range) {
    const rowPositions = [];
    const cellsToFlash = {};
    const startRow = this.rangeService.getRangeStartRow(range);
    const lastRow = this.rangeService.getRangeEndRow(range);
    let node = startRow;
    while (node) {
      rowPositions.push(node);
      range.columns.forEach(column => {
        const {
          rowIndex,
          rowPinned
        } = node;
        const cellId = this.cellPositionUtils.createIdFromValues({
          rowIndex,
          column,
          rowPinned
        });
        cellsToFlash[cellId] = true;
      });
      if (this.rowPositionUtils.sameRow(node, lastRow)) {
        break;
      }
      node = this.cellNavigationService.getRowBelow(node);
    }
    return {
      rowPositions,
      cellsToFlash
    };
  }
  copyFocusedCellToClipboard(params = {}) {
    const focusedCell = this.focusService.getFocusedCell();
    if (focusedCell == null) {
      return;
    }
    const cellId = this.cellPositionUtils.createId(focusedCell);
    const currentRow = {
      rowPinned: focusedCell.rowPinned,
      rowIndex: focusedCell.rowIndex
    };
    const column = focusedCell.column;
    const data = this.buildExportParams({
      columns: [column],
      rowPositions: [currentRow],
      includeHeaders: params.includeHeaders,
      includeGroupHeaders: params.includeGroupHeaders
    });
    this.copyDataToClipboard(data);
    this.dispatchFlashCells({
      [cellId]: true
    });
  }
  copySelectedRowsToClipboard(params = {}) {
    const {
      columnKeys,
      includeHeaders,
      includeGroupHeaders
    } = params;
    const data = this.buildExportParams({
      columns: columnKeys,
      includeHeaders,
      includeGroupHeaders
    });
    this.copyDataToClipboard(data);
  }
  buildExportParams(params) {
    const {
      columns,
      rowPositions,
      includeHeaders = false,
      includeGroupHeaders = false
    } = params;
    const exportParams = {
      columnKeys: columns,
      rowPositions,
      skipColumnHeaders: !includeHeaders,
      skipColumnGroupHeaders: !includeGroupHeaders,
      suppressQuotes: true,
      columnSeparator: this.getClipboardDelimiter(),
      onlySelected: !rowPositions,
      processCellCallback: this.gridOptionsService.getCallback('processCellForClipboard'),
      processRowGroupCallback: params => this.processRowGroupCallback(params),
      processHeaderCallback: this.gridOptionsService.getCallback('processHeaderForClipboard'),
      processGroupHeaderCallback: this.gridOptionsService.getCallback('processGroupHeaderForClipboard')
    };
    return this.csvCreator.getDataAsCsv(exportParams, true);
  }
  processRowGroupCallback(params) {
    const {
      node
    } = params;
    const {
      key
    } = node;
    let value = key != null ? key : '';
    if (params.node.footer) {
      let suffix = '';
      if (key && key.length) {
        suffix = ` ${key}`;
      }
      value = `Total${suffix}`;
    }
    const processCellForClipboard = this.gridOptionsService.getCallback('processCellForClipboard');
    if (processCellForClipboard) {
      let column = node.rowGroupColumn;
      if (!column && node.footer && node.level === -1) {
        column = this.columnModel.getRowGroupColumns()[0];
      }
      return processCellForClipboard({
        value,
        node,
        column,
        type: 'clipboard',
        formatValue: valueToFormat => {
          var _a;
          return (_a = this.valueFormatterService.formatValue(column, node, valueToFormat)) !== null && _a !== void 0 ? _a : valueToFormat;
        },
        parseValue: valueToParse => this.valueParserService.parseValue(column, node, valueToParse, this.valueService.getValue(column, node))
      });
    }
    return value;
  }
  dispatchFlashCells(cellsToFlash) {
    window.setTimeout(() => {
      const event = {
        type: Events.EVENT_FLASH_CELLS,
        cells: cellsToFlash
      };
      this.eventService.dispatchEvent(event);
    }, 0);
  }
  processCell(rowNode, column, value, type, func, canParse, canFormat) {
    var _a;
    if (func) {
      const params = {
        column,
        node: rowNode,
        value,
        type,
        formatValue: valueToFormat => {
          var _a;
          return (_a = this.valueFormatterService.formatValue(column, rowNode !== null && rowNode !== void 0 ? rowNode : null, valueToFormat)) !== null && _a !== void 0 ? _a : valueToFormat;
        },
        parseValue: valueToParse => this.valueParserService.parseValue(column, rowNode !== null && rowNode !== void 0 ? rowNode : null, valueToParse, this.valueService.getValue(column, rowNode))
      };
      return func(params);
    }
    if (canParse && column.getColDef().useValueParserForImport !== false) {
      return this.valueParserService.parseValue(column, rowNode !== null && rowNode !== void 0 ? rowNode : null, value, this.valueService.getValue(column, rowNode));
    } else if (canFormat && column.getColDef().useValueFormatterForExport !== false) {
      return (_a = this.valueFormatterService.formatValue(column, rowNode !== null && rowNode !== void 0 ? rowNode : null, value)) !== null && _a !== void 0 ? _a : value;
    }
    return value;
  }
  copyDataToClipboard(data) {
    const userProvidedFunc = this.gridOptionsService.getCallback('sendToClipboard');
    if (userProvidedFunc) {
      userProvidedFunc({
        data
      });
      return;
    }
    const allowNavigator = !this.gridOptionsService.get('suppressClipboardApi');
    if (allowNavigator && navigator.clipboard) {
      navigator.clipboard.writeText(data).catch(e => {
        _.doOnce(() => {
          console.warn(e);
          console.warn(apiError('writeText'));
        }, 'clipboardApiError');
        this.copyDataToClipboardLegacy(data);
      });
      return;
    }
    this.copyDataToClipboardLegacy(data);
  }
  copyDataToClipboardLegacy(data) {
    this.executeOnTempElement(element => {
      const eDocument = this.gridOptionsService.getDocument();
      const focusedElementBefore = eDocument.activeElement;
      element.value = data || ' ';
      element.select();
      element.focus({
        preventScroll: true
      });
      const result = eDocument.execCommand('copy');
      if (!result) {
        console.warn('ZING Grid: Browser did not allow document.execCommand(\'copy\'). Ensure ' + 'api.copySelectedRowsToClipboard() is invoked via a user event, i.e. button click, otherwise ' + 'the browser will prevent it for security reasons.');
      }
      if (focusedElementBefore != null && focusedElementBefore.focus != null) {
        focusedElementBefore.focus({
          preventScroll: true
        });
      }
    });
  }
  executeOnTempElement(callbackNow, callbackAfter) {
    const eDoc = this.gridOptionsService.getDocument();
    const eTempInput = eDoc.createElement('textarea');
    eTempInput.style.width = '1px';
    eTempInput.style.height = '1px';
    eTempInput.style.top = eDoc.documentElement.scrollTop + 'px';
    eTempInput.style.left = eDoc.documentElement.scrollLeft + 'px';
    eTempInput.style.position = 'absolute';
    eTempInput.style.opacity = '0';
    const guiRoot = this.gridCtrl.getGui();
    guiRoot.appendChild(eTempInput);
    try {
      callbackNow(eTempInput);
    } catch (err) {
      console.warn('ZING Grid: Browser does not support document.execCommand(\'copy\') for clipboard operations');
    }
    if (callbackAfter) {
      window.setTimeout(() => {
        callbackAfter(eTempInput);
        guiRoot.removeChild(eTempInput);
      }, 100);
    } else {
      guiRoot.removeChild(eTempInput);
    }
  }
  getRangeSize() {
    const ranges = this.rangeService.getCellRanges();
    let startRangeIndex = 0;
    let endRangeIndex = 0;
    if (ranges.length > 0) {
      startRangeIndex = this.rangeService.getRangeStartRow(ranges[0]).rowIndex;
      endRangeIndex = this.rangeService.getRangeEndRow(ranges[0]).rowIndex;
    }
    return startRangeIndex - endRangeIndex + 1;
  }
};
__decorate([Autowired('csvCreator')], ClipboardService.prototype, "csvCreator", void 0);
__decorate([Autowired('loggerFactory')], ClipboardService.prototype, "loggerFactory", void 0);
__decorate([Autowired('selectionService')], ClipboardService.prototype, "selectionService", void 0);
__decorate([Optional('rangeService')], ClipboardService.prototype, "rangeService", void 0);
__decorate([Autowired('rowModel')], ClipboardService.prototype, "rowModel", void 0);
__decorate([Autowired('ctrlsService')], ClipboardService.prototype, "ctrlsService", void 0);
__decorate([Autowired('valueService')], ClipboardService.prototype, "valueService", void 0);
__decorate([Autowired('focusService')], ClipboardService.prototype, "focusService", void 0);
__decorate([Autowired('rowRenderer')], ClipboardService.prototype, "rowRenderer", void 0);
__decorate([Autowired('columnModel')], ClipboardService.prototype, "columnModel", void 0);
__decorate([Autowired('cellNavigationService')], ClipboardService.prototype, "cellNavigationService", void 0);
__decorate([Autowired('cellPositionUtils')], ClipboardService.prototype, "cellPositionUtils", void 0);
__decorate([Autowired('rowPositionUtils')], ClipboardService.prototype, "rowPositionUtils", void 0);
__decorate([Autowired('valueFormatterService')], ClipboardService.prototype, "valueFormatterService", void 0);
__decorate([Autowired('valueParserService')], ClipboardService.prototype, "valueParserService", void 0);
__decorate([PostConstruct], ClipboardService.prototype, "init", null);
ClipboardService = ClipboardService_1 = __decorate([Bean('clipboardService')], ClipboardService);
export { ClipboardService };
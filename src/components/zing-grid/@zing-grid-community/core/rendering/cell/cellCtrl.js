import { Events } from "../../events";
import { CellRangeFeature } from "./cellRangeFeature";
import { exists, makeNull } from "../../utils/generic";
import { BeanStub } from "../../context/beanStub";
import { CellPositionFeature } from "./cellPositionFeature";
import { escapeString } from "../../utils/string";
import { CellCustomStyleFeature } from "./cellCustomStyleFeature";
import { TooltipFeature } from "../../widgets/tooltipFeature";
import { CellMouseListenerFeature } from "./cellMouseListenerFeature";
import { CellKeyboardListenerFeature } from "./cellKeyboardListenerFeature";
import { KeyCode } from "../../constants/keyCode";
import { CheckboxSelectionComponent } from "../checkboxSelectionComponent";
import { DndSourceComp } from "../dndSourceComp";
import { warnOnce } from "../../utils/function";
import { RowDragComp } from "../row/rowDragComp";
import { getValueUsingField } from "../../utils/object";
import { getElementSize } from "../../utils/dom";
import { setAriaColIndex } from "../../utils/aria";
import { CssClassApplier } from "../../headerRendering/cells/cssClassApplier";
const CSS_CELL = 'zing-cell';
const CSS_AUTO_HEIGHT = 'zing-cell-auto-height';
const CSS_NORMAL_HEIGHT = 'zing-cell-normal-height';
const CSS_CELL_FOCUS = 'zing-cell-focus';
const CSS_CELL_FIRST_RIGHT_PINNED = 'zing-cell-first-right-pinned';
const CSS_CELL_LAST_LEFT_PINNED = 'zing-cell-last-left-pinned';
const CSS_CELL_NOT_INLINE_EDITING = 'zing-cell-not-inline-editing';
const CSS_COLUMN_HOVER = 'zing-column-hover';
const CSS_CELL_WRAP_TEXT = 'zing-cell-wrap-text';
let instanceIdSequence = 0;
export class CellCtrl extends BeanStub {
  constructor(column, rowNode, beans, rowCtrl) {
    super();
    this.cellRangeFeature = null;
    this.cellPositionFeature = null;
    this.cellCustomStyleFeature = null;
    this.tooltipFeature = null;
    this.cellMouseListenerFeature = null;
    this.cellKeyboardListenerFeature = null;
    this.suppressRefreshCell = false;
    this.onCellCompAttachedFuncs = [];
    this.column = column;
    this.rowNode = rowNode;
    this.beans = beans;
    this.rowCtrl = rowCtrl;
    this.instanceId = column.getId() + '-' + instanceIdSequence++;
    const colDef = this.column.getColDef();
    this.colIdSanitised = escapeString(this.column.getId());
    if (!this.beans.gridOptionsService.get('suppressCellFocus')) {
      this.tabIndex = -1;
    }
    this.isCellRenderer = colDef.cellRenderer != null || colDef.cellRendererSelector != null;
    this.createCellPosition();
    this.addFeatures();
    this.updateAndFormatValue(false);
  }
  shouldRestoreFocus() {
    return this.beans.focusService.shouldRestoreFocus(this.cellPosition);
  }
  addFeatures() {
    this.cellPositionFeature = new CellPositionFeature(this, this.beans);
    this.addDestroyFunc(() => {
      var _a;
      (_a = this.cellPositionFeature) === null || _a === void 0 ? void 0 : _a.destroy();
      this.cellPositionFeature = null;
    });
    this.cellCustomStyleFeature = new CellCustomStyleFeature(this, this.beans);
    this.addDestroyFunc(() => {
      var _a;
      (_a = this.cellCustomStyleFeature) === null || _a === void 0 ? void 0 : _a.destroy();
      this.cellCustomStyleFeature = null;
    });
    this.cellMouseListenerFeature = new CellMouseListenerFeature(this, this.beans, this.column);
    this.addDestroyFunc(() => {
      var _a;
      (_a = this.cellMouseListenerFeature) === null || _a === void 0 ? void 0 : _a.destroy();
      this.cellMouseListenerFeature = null;
    });
    this.cellKeyboardListenerFeature = new CellKeyboardListenerFeature(this, this.beans, this.column, this.rowNode, this.rowCtrl);
    this.addDestroyFunc(() => {
      var _a;
      (_a = this.cellKeyboardListenerFeature) === null || _a === void 0 ? void 0 : _a.destroy();
      this.cellKeyboardListenerFeature = null;
    });
    if (this.column.isTooltipEnabled()) {
      this.enableTooltipFeature();
      this.addDestroyFunc(() => {
        this.disableTooltipFeature();
      });
    }
    const rangeSelectionEnabled = this.beans.rangeService && this.beans.gridOptionsService.get('enableRangeSelection');
    if (rangeSelectionEnabled) {
      this.cellRangeFeature = new CellRangeFeature(this.beans, this);
      this.addDestroyFunc(() => {
        var _a;
        (_a = this.cellRangeFeature) === null || _a === void 0 ? void 0 : _a.destroy();
        this.cellRangeFeature = null;
      });
    }
  }
  enableTooltipFeature() {
    const getTooltipValue = () => {
      const colDef = this.column.getColDef();
      const data = this.rowNode.data;
      if (colDef.tooltipField && exists(data)) {
        return getValueUsingField(data, colDef.tooltipField, this.column.isTooltipFieldContainsDots());
      }
      const valueGetter = colDef.tooltipValueGetter;
      if (valueGetter) {
        return valueGetter({
          location: 'cell',
          api: this.beans.gridOptionsService.api,
          columnApi: this.beans.gridOptionsService.columnApi,
          context: this.beans.gridOptionsService.context,
          colDef: this.column.getColDef(),
          column: this.column,
          rowIndex: this.cellPosition.rowIndex,
          node: this.rowNode,
          data: this.rowNode.data,
          value: this.value,
          valueFormatted: this.valueFormatted
        });
      }
      return null;
    };
    const tooltipCtrl = {
      getColumn: () => this.column,
      getColDef: () => this.column.getColDef(),
      getRowIndex: () => this.cellPosition.rowIndex,
      getRowNode: () => this.rowNode,
      getGui: () => this.getGui(),
      getLocation: () => 'cell',
      getTooltipValue: getTooltipValue,
      getValueFormatted: () => this.valueFormatted
    };
    this.tooltipFeature = new TooltipFeature(tooltipCtrl, this.beans);
  }
  disableTooltipFeature() {
    if (!this.tooltipFeature) {
      return;
    }
    this.tooltipFeature.destroy();
    this.tooltipFeature = null;
  }
  setComp(comp, eGui, eCellWrapper, printLayout, startEditing) {
    var _a, _b, _c, _d;
    this.cellComp = comp;
    this.eGui = eGui;
    this.printLayout = printLayout;
    this.addDomData();
    this.onCellFocused(this.focusEventToRestore);
    this.applyStaticCssClasses();
    this.setWrapText();
    this.onFirstRightPinnedChanged();
    this.onLastLeftPinnedChanged();
    this.onColumnHover();
    this.setupControlComps();
    this.setupAutoHeight(eCellWrapper);
    this.refreshFirstAndLastStyles();
    this.refreshAriaColIndex();
    (_a = this.cellPositionFeature) === null || _a === void 0 ? void 0 : _a.setComp(eGui);
    (_b = this.cellCustomStyleFeature) === null || _b === void 0 ? void 0 : _b.setComp(comp);
    (_c = this.tooltipFeature) === null || _c === void 0 ? void 0 : _c.setComp(eGui);
    (_d = this.cellKeyboardListenerFeature) === null || _d === void 0 ? void 0 : _d.setComp(this.eGui);
    if (this.cellRangeFeature) {
      this.cellRangeFeature.setComp(comp, eGui);
    }
    if (startEditing && this.isCellEditable()) {
      this.startEditing();
    } else {
      this.showValue();
    }
    if (this.onCellCompAttachedFuncs.length) {
      this.onCellCompAttachedFuncs.forEach(func => func());
      this.onCellCompAttachedFuncs = [];
    }
  }
  setupAutoHeight(eCellWrapper) {
    this.isAutoHeight = this.column.isAutoHeight();
    if (!this.isAutoHeight || !eCellWrapper) {
      return;
    }
    const eParentCell = eCellWrapper.parentElement;
    const minRowHeight = this.beans.gridOptionsService.getRowHeightForNode(this.rowNode).height;
    const measureHeight = timesCalled => {
      if (this.editing) {
        return;
      }
      if (!this.isAlive()) {
        return;
      }
      const {
        paddingTop,
        paddingBottom,
        borderBottomWidth,
        borderTopWidth
      } = getElementSize(eParentCell);
      const extraHeight = paddingTop + paddingBottom + borderBottomWidth + borderTopWidth;
      const wrapperHeight = eCellWrapper.offsetHeight;
      const autoHeight = wrapperHeight + extraHeight;
      if (timesCalled < 5) {
        const doc = this.beans.gridOptionsService.getDocument();
        const notYetInDom = !doc || !doc.contains(eCellWrapper);
        const possiblyNoContentYet = autoHeight == 0;
        if (notYetInDom || possiblyNoContentYet) {
          this.beans.frameworkOverrides.setTimeout(() => measureHeight(timesCalled + 1), 0);
          return;
        }
      }
      const newHeight = Math.max(autoHeight, minRowHeight);
      this.rowNode.setRowAutoHeight(newHeight, this.column);
    };
    const listener = () => measureHeight(0);
    listener();
    const destroyResizeObserver = this.beans.resizeObserverService.observeResize(eCellWrapper, listener);
    this.addDestroyFunc(() => {
      destroyResizeObserver();
      this.rowNode.setRowAutoHeight(undefined, this.column);
    });
  }
  getCellAriaRole() {
    var _a;
    return (_a = this.column.getColDef().cellAriaRole) !== null && _a !== void 0 ? _a : 'gridcell';
  }
  getInstanceId() {
    return this.instanceId;
  }
  getIncludeSelection() {
    return this.includeSelection;
  }
  getIncludeRowDrag() {
    return this.includeRowDrag;
  }
  getIncludeDndSource() {
    return this.includeDndSource;
  }
  getColumnIdSanitised() {
    return this.colIdSanitised;
  }
  getTabIndex() {
    return this.tabIndex;
  }
  getIsCellRenderer() {
    return this.isCellRenderer;
  }
  getValueToDisplay() {
    return this.valueFormatted != null ? this.valueFormatted : this.value;
  }
  showValue(forceNewCellRendererInstance = false) {
    const valueToDisplay = this.getValueToDisplay();
    let compDetails;
    if (this.isCellRenderer) {
      const params = this.createCellRendererParams();
      compDetails = this.beans.userComponentFactory.getCellRendererDetails(this.column.getColDef(), params);
    }
    this.cellComp.setRenderDetails(compDetails, valueToDisplay, forceNewCellRendererInstance);
    this.refreshHandle();
  }
  setupControlComps() {
    const colDef = this.column.getColDef();
    this.includeSelection = this.isIncludeControl(colDef.checkboxSelection);
    this.includeRowDrag = this.isIncludeControl(colDef.rowDrag);
    this.includeDndSource = this.isIncludeControl(colDef.dndSource);
    this.cellComp.setIncludeSelection(this.includeSelection);
    this.cellComp.setIncludeDndSource(this.includeDndSource);
    this.cellComp.setIncludeRowDrag(this.includeRowDrag);
  }
  isForceWrapper() {
    const forceWrapper = this.beans.gridOptionsService.get('enableCellTextSelection') || this.column.isAutoHeight();
    return forceWrapper;
  }
  isIncludeControl(value) {
    const rowNodePinned = this.rowNode.rowPinned != null;
    const isFunc = typeof value === 'function';
    const res = rowNodePinned ? false : isFunc || value === true;
    return res;
  }
  refreshShouldDestroy() {
    const colDef = this.column.getColDef();
    const selectionChanged = this.includeSelection != this.isIncludeControl(colDef.checkboxSelection);
    const rowDragChanged = this.includeRowDrag != this.isIncludeControl(colDef.rowDrag);
    const dndSourceChanged = this.includeDndSource != this.isIncludeControl(colDef.dndSource);
    return selectionChanged || rowDragChanged || dndSourceChanged;
  }
  startEditing(key = null, cellStartedEdit = false, event = null) {
    if (!this.isCellEditable() || this.editing) {
      return;
    }
    if (!this.cellComp) {
      this.onCellCompAttachedFuncs.push(() => {
        this.startEditing(key, cellStartedEdit, event);
      });
      return;
    }
    const editorParams = this.createCellEditorParams(key, cellStartedEdit);
    const colDef = this.column.getColDef();
    const compDetails = this.beans.userComponentFactory.getCellEditorDetails(colDef, editorParams);
    const popup = (compDetails === null || compDetails === void 0 ? void 0 : compDetails.popupFromSelector) != null ? compDetails.popupFromSelector : !!colDef.cellEditorPopup;
    const position = (compDetails === null || compDetails === void 0 ? void 0 : compDetails.popupPositionFromSelector) != null ? compDetails.popupPositionFromSelector : colDef.cellEditorPopupPosition;
    this.setEditing(true);
    this.cellComp.setEditDetails(compDetails, popup, position);
    const e = this.createEvent(event, Events.EVENT_CELL_EDITING_STARTED);
    this.beans.eventService.dispatchEvent(e);
  }
  setEditing(editing) {
    if (this.editing === editing) {
      return;
    }
    this.editing = editing;
    this.refreshHandle();
  }
  stopRowOrCellEdit(cancel = false) {
    if (this.beans.gridOptionsService.get('editType') === 'fullRow') {
      this.rowCtrl.stopRowEditing(cancel);
    } else {
      this.stopEditing(cancel);
    }
  }
  onPopupEditorClosed() {
    if (!this.isEditing()) {
      return;
    }
    this.stopEditingAndFocus();
  }
  takeValueFromCellEditor(cancel) {
    const noValueResult = {
      newValueExists: false
    };
    if (cancel) {
      return noValueResult;
    }
    const cellEditor = this.cellComp.getCellEditor();
    if (!cellEditor) {
      return noValueResult;
    }
    const userWantsToCancel = cellEditor.isCancelAfterEnd && cellEditor.isCancelAfterEnd();
    if (userWantsToCancel) {
      return noValueResult;
    }
    const newValue = cellEditor.getValue();
    return {
      newValue: newValue,
      newValueExists: true
    };
  }
  saveNewValue(oldValue, newValue) {
    if (newValue === oldValue) {
      return false;
    }
    this.suppressRefreshCell = true;
    const valueChanged = this.rowNode.setDataValue(this.column, newValue, 'edit');
    this.suppressRefreshCell = false;
    return valueChanged;
  }
  stopEditing(cancel = false) {
    if (!this.editing) {
      return false;
    }
    const {
      newValue,
      newValueExists
    } = this.takeValueFromCellEditor(cancel);
    const oldValue = this.rowNode.getValueFromValueService(this.column);
    let valueChanged = false;
    if (newValueExists) {
      valueChanged = this.saveNewValue(oldValue, newValue);
    }
    this.setEditing(false);
    this.cellComp.setEditDetails();
    this.updateAndFormatValue(false);
    this.refreshCell({
      forceRefresh: true,
      suppressFlash: true
    });
    this.dispatchEditingStoppedEvent(oldValue, newValue, !cancel && !!valueChanged);
    return valueChanged;
  }
  dispatchEditingStoppedEvent(oldValue, newValue, valueChanged) {
    const editingStoppedEvent = Object.assign(Object.assign({}, this.createEvent(null, Events.EVENT_CELL_EDITING_STOPPED)), {
      oldValue,
      newValue,
      valueChanged
    });
    this.beans.eventService.dispatchEvent(editingStoppedEvent);
  }
  createCellEditorParams(key, cellStartedEdit) {
    return {
      value: this.rowNode.getValueFromValueService(this.column),
      eventKey: key,
      column: this.column,
      colDef: this.column.getColDef(),
      rowIndex: this.getCellPosition().rowIndex,
      node: this.rowNode,
      data: this.rowNode.data,
      api: this.beans.gridOptionsService.api,
      cellStartedEdit: cellStartedEdit,
      columnApi: this.beans.gridOptionsService.columnApi,
      context: this.beans.gridOptionsService.context,
      onKeyDown: this.onKeyDown.bind(this),
      stopEditing: this.stopEditingAndFocus.bind(this),
      eGridCell: this.getGui(),
      parseValue: this.parseValue.bind(this),
      formatValue: this.formatValue.bind(this)
    };
  }
  createCellRendererParams() {
    const res = {
      value: this.value,
      valueFormatted: this.valueFormatted,
      getValue: () => this.rowNode.getValueFromValueService(this.column),
      setValue: value => this.beans.valueService.setValue(this.rowNode, this.column, value),
      formatValue: this.formatValue.bind(this),
      data: this.rowNode.data,
      node: this.rowNode,
      pinned: this.column.getPinned(),
      colDef: this.column.getColDef(),
      column: this.column,
      rowIndex: this.getCellPosition().rowIndex,
      api: this.beans.gridOptionsService.api,
      columnApi: this.beans.gridOptionsService.columnApi,
      context: this.beans.gridOptionsService.context,
      refreshCell: this.refreshCell.bind(this),
      eGridCell: this.getGui(),
      eParentOfValue: this.cellComp.getParentOfValue(),
      registerRowDragger: (rowDraggerElement, dragStartPixels, value, suppressVisibilityChange) => this.registerRowDragger(rowDraggerElement, dragStartPixels, suppressVisibilityChange)
    };
    return res;
  }
  parseValue(newValue) {
    return this.beans.valueParserService.parseValue(this.column, this.rowNode, newValue, this.getValue());
  }
  setFocusOutOnEditor() {
    if (!this.editing) {
      return;
    }
    const cellEditor = this.cellComp.getCellEditor();
    if (cellEditor && cellEditor.focusOut) {
      cellEditor.focusOut();
    }
  }
  setFocusInOnEditor() {
    if (!this.editing) {
      return;
    }
    const cellEditor = this.cellComp.getCellEditor();
    if (cellEditor && cellEditor.focusIn) {
      cellEditor.focusIn();
    } else {
      this.focusCell(true);
    }
  }
  onCellChanged(event) {
    const eventImpactsThisCell = event.column === this.column;
    if (eventImpactsThisCell) {
      this.refreshCell({});
    }
  }
  refreshOrDestroyCell(params) {
    var _a;
    if (this.refreshShouldDestroy()) {
      (_a = this.rowCtrl) === null || _a === void 0 ? void 0 : _a.refreshCell(this);
    } else {
      this.refreshCell(params);
    }
  }
  refreshCell(params) {
    var _a, _b, _c;
    if (this.suppressRefreshCell || this.editing) {
      return;
    }
    const colDef = this.column.getColDef();
    const newData = params != null && !!params.newData;
    const suppressFlash = params != null && !!params.suppressFlash || !!colDef.suppressCellFlash;
    const noValueProvided = colDef.field == null && colDef.valueGetter == null && colDef.showRowGroup == null;
    const forceRefresh = params && params.forceRefresh || noValueProvided || newData;
    const isCellCompReady = !!this.cellComp;
    const valuesDifferent = this.updateAndFormatValue(isCellCompReady);
    const dataNeedsUpdating = forceRefresh || valuesDifferent;
    if (!isCellCompReady) {
      return;
    }
    if (dataNeedsUpdating) {
      this.showValue(newData);
      const processingFilterChange = this.beans.filterManager.isSuppressFlashingCellsBecauseFiltering();
      const flashCell = !suppressFlash && !processingFilterChange && (this.beans.gridOptionsService.get('enableCellChangeFlash') || colDef.enableCellChangeFlash);
      if (flashCell) {
        this.flashCell();
      }
      (_a = this.cellCustomStyleFeature) === null || _a === void 0 ? void 0 : _a.applyUserStyles();
      (_b = this.cellCustomStyleFeature) === null || _b === void 0 ? void 0 : _b.applyClassesFromColDef();
    }
    this.refreshToolTip();
    (_c = this.cellCustomStyleFeature) === null || _c === void 0 ? void 0 : _c.applyCellClassRules();
  }
  stopEditingAndFocus(suppressNavigateAfterEdit = false, shiftKey = false) {
    this.stopRowOrCellEdit();
    this.focusCell(true);
    if (!suppressNavigateAfterEdit) {
      this.navigateAfterEdit(shiftKey);
    }
  }
  navigateAfterEdit(shiftKey) {
    const enterNavigatesVerticallyAfterEdit = this.beans.gridOptionsService.get('enterNavigatesVerticallyAfterEdit');
    if (enterNavigatesVerticallyAfterEdit) {
      const key = shiftKey ? KeyCode.UP : KeyCode.DOWN;
      this.beans.navigationService.navigateToNextCell(null, key, this.getCellPosition(), false);
    }
  }
  flashCell(delays) {
    const flashDelay = delays && delays.flashDelay;
    const fadeDelay = delays && delays.fadeDelay;
    this.animateCell('data-changed', flashDelay, fadeDelay);
  }
  animateCell(cssName, flashDelay, fadeDelay) {
    if (!this.cellComp) {
      return;
    }
    const fullName = `zing-cell-${cssName}`;
    const animationFullName = `zing-cell-${cssName}-animation`;
    const {
      gridOptionsService
    } = this.beans;
    if (!flashDelay) {
      flashDelay = gridOptionsService.get('cellFlashDelay');
    }
    if (!exists(fadeDelay)) {
      fadeDelay = gridOptionsService.get('cellFadeDelay');
    }
    this.cellComp.addOrRemoveCssClass(fullName, true);
    this.cellComp.addOrRemoveCssClass(animationFullName, false);
    window.setTimeout(() => {
      if (!this.isAlive()) {
        return;
      }
      this.cellComp.addOrRemoveCssClass(fullName, false);
      this.cellComp.addOrRemoveCssClass(animationFullName, true);
      this.eGui.style.transition = `background-color ${fadeDelay}ms`;
      window.setTimeout(() => {
        if (!this.isAlive()) {
          return;
        }
        this.cellComp.addOrRemoveCssClass(animationFullName, false);
        this.eGui.style.transition = '';
      }, fadeDelay);
    }, flashDelay);
  }
  onFlashCells(event) {
    if (!this.cellComp) {
      return;
    }
    const cellId = this.beans.cellPositionUtils.createId(this.getCellPosition());
    const shouldFlash = event.cells[cellId];
    if (shouldFlash) {
      this.animateCell('highlight');
    }
  }
  isCellEditable() {
    return this.column.isCellEditable(this.rowNode);
  }
  isSuppressFillHandle() {
    return this.column.isSuppressFillHandle();
  }
  formatValue(value) {
    var _a;
    return (_a = this.callValueFormatter(value)) !== null && _a !== void 0 ? _a : value;
  }
  callValueFormatter(value) {
    return this.beans.valueFormatterService.formatValue(this.column, this.rowNode, value);
  }
  updateAndFormatValue(compareValues) {
    const oldValue = this.value;
    const oldValueFormatted = this.valueFormatted;
    this.value = this.rowNode.getValueFromValueService(this.column);
    this.valueFormatted = this.callValueFormatter(this.value);
    if (compareValues) {
      return !this.valuesAreEqual(oldValue, this.value) || this.valueFormatted != oldValueFormatted;
    }
    return true;
  }
  valuesAreEqual(val1, val2) {
    const colDef = this.column.getColDef();
    return colDef.equals ? colDef.equals(val1, val2) : val1 === val2;
  }
  getComp() {
    return this.cellComp;
  }
  getValue() {
    return this.value;
  }
  getValueFormatted() {
    return this.valueFormatted;
  }
  addDomData() {
    const element = this.getGui();
    this.beans.gridOptionsService.setDomData(element, CellCtrl.DOM_DATA_KEY_CELL_CTRL, this);
    this.addDestroyFunc(() => this.beans.gridOptionsService.setDomData(element, CellCtrl.DOM_DATA_KEY_CELL_CTRL, null));
  }
  createEvent(domEvent, eventType) {
    const event = {
      type: eventType,
      node: this.rowNode,
      data: this.rowNode.data,
      value: this.value,
      column: this.column,
      colDef: this.column.getColDef(),
      context: this.beans.gridOptionsService.context,
      api: this.beans.gridApi,
      columnApi: this.beans.columnApi,
      rowPinned: this.rowNode.rowPinned,
      event: domEvent,
      rowIndex: this.rowNode.rowIndex
    };
    return event;
  }
  processCharacter(event) {
    var _a;
    (_a = this.cellKeyboardListenerFeature) === null || _a === void 0 ? void 0 : _a.processCharacter(event);
  }
  onKeyDown(event) {
    var _a;
    (_a = this.cellKeyboardListenerFeature) === null || _a === void 0 ? void 0 : _a.onKeyDown(event);
  }
  onMouseEvent(eventName, mouseEvent) {
    var _a;
    (_a = this.cellMouseListenerFeature) === null || _a === void 0 ? void 0 : _a.onMouseEvent(eventName, mouseEvent);
  }
  getGui() {
    return this.eGui;
  }
  refreshToolTip() {
    var _a;
    (_a = this.tooltipFeature) === null || _a === void 0 ? void 0 : _a.refreshToolTip();
  }
  getColSpanningList() {
    return this.cellPositionFeature.getColSpanningList();
  }
  onLeftChanged() {
    var _a;
    if (!this.cellComp) {
      return;
    }
    (_a = this.cellPositionFeature) === null || _a === void 0 ? void 0 : _a.onLeftChanged();
  }
  onDisplayedColumnsChanged() {
    if (!this.eGui) {
      return;
    }
    this.refreshAriaColIndex();
    this.refreshFirstAndLastStyles();
  }
  refreshFirstAndLastStyles() {
    const {
      cellComp,
      column,
      beans
    } = this;
    CssClassApplier.refreshFirstAndLastStyles(cellComp, column, beans.columnModel);
  }
  refreshAriaColIndex() {
    const colIdx = this.beans.columnModel.getAriaColumnIndex(this.column);
    setAriaColIndex(this.getGui(), colIdx);
  }
  isSuppressNavigable() {
    return this.column.isSuppressNavigable(this.rowNode);
  }
  onWidthChanged() {
    var _a;
    return (_a = this.cellPositionFeature) === null || _a === void 0 ? void 0 : _a.onWidthChanged();
  }
  getColumn() {
    return this.column;
  }
  getRowNode() {
    return this.rowNode;
  }
  getBeans() {
    return this.beans;
  }
  isPrintLayout() {
    return this.printLayout;
  }
  appendChild(htmlElement) {
    this.eGui.appendChild(htmlElement);
  }
  refreshHandle() {
    if (this.cellRangeFeature) {
      this.cellRangeFeature.refreshHandle();
    }
  }
  getCellPosition() {
    return this.cellPosition;
  }
  isEditing() {
    return this.editing;
  }
  startRowOrCellEdit(key, event = null) {
    if (!this.cellComp) {
      return;
    }
    if (this.beans.gridOptionsService.get('editType') === 'fullRow') {
      this.rowCtrl.startRowEditing(key, this);
    } else {
      this.startEditing(key, true, event);
    }
  }
  getRowCtrl() {
    return this.rowCtrl;
  }
  getRowPosition() {
    return {
      rowIndex: this.cellPosition.rowIndex,
      rowPinned: this.cellPosition.rowPinned
    };
  }
  updateRangeBordersIfRangeCount() {
    if (!this.cellComp) {
      return;
    }
    if (this.cellRangeFeature) {
      this.cellRangeFeature.updateRangeBordersIfRangeCount();
    }
  }
  onRangeSelectionChanged() {
    if (!this.cellComp) {
      return;
    }
    if (this.cellRangeFeature) {
      this.cellRangeFeature.onRangeSelectionChanged();
    }
  }
  isRangeSelectionEnabled() {
    return this.cellRangeFeature != null;
  }
  focusCell(forceBrowserFocus = false) {
    this.beans.focusService.setFocusedCell({
      rowIndex: this.getCellPosition().rowIndex,
      column: this.column,
      rowPinned: this.rowNode.rowPinned,
      forceBrowserFocus
    });
  }
  onRowIndexChanged() {
    this.createCellPosition();
    this.onCellFocused();
    if (this.cellRangeFeature) {
      this.cellRangeFeature.onRangeSelectionChanged();
    }
  }
  onFirstRightPinnedChanged() {
    if (!this.cellComp) {
      return;
    }
    const firstRightPinned = this.column.isFirstRightPinned();
    this.cellComp.addOrRemoveCssClass(CSS_CELL_FIRST_RIGHT_PINNED, firstRightPinned);
  }
  onLastLeftPinnedChanged() {
    if (!this.cellComp) {
      return;
    }
    const lastLeftPinned = this.column.isLastLeftPinned();
    this.cellComp.addOrRemoveCssClass(CSS_CELL_LAST_LEFT_PINNED, lastLeftPinned);
  }
  onCellFocused(event) {
    if (this.beans.gridOptionsService.get('suppressCellFocus')) {
      return;
    }
    const cellFocused = this.beans.focusService.isCellFocused(this.cellPosition);
    if (!this.cellComp) {
      if (cellFocused && (event === null || event === void 0 ? void 0 : event.forceBrowserFocus)) {
        this.focusEventToRestore = event;
      }
      return;
    }
    this.focusEventToRestore = undefined;
    this.cellComp.addOrRemoveCssClass(CSS_CELL_FOCUS, cellFocused);
    if (cellFocused && event && event.forceBrowserFocus) {
      const focusEl = this.cellComp.getFocusableElement();
      focusEl.focus({
        preventScroll: !!event.preventScrollOnBrowserFocus
      });
    }
    const fullRowEdit = this.beans.gridOptionsService.get('editType') === 'fullRow';
    if (!cellFocused && !fullRowEdit && this.editing) {
      this.stopRowOrCellEdit();
    }
  }
  createCellPosition() {
    this.cellPosition = {
      rowIndex: this.rowNode.rowIndex,
      rowPinned: makeNull(this.rowNode.rowPinned),
      column: this.column
    };
  }
  applyStaticCssClasses() {
    this.cellComp.addOrRemoveCssClass(CSS_CELL, true);
    this.cellComp.addOrRemoveCssClass(CSS_CELL_NOT_INLINE_EDITING, true);
    const autoHeight = this.column.isAutoHeight() == true;
    this.cellComp.addOrRemoveCssClass(CSS_AUTO_HEIGHT, autoHeight);
    this.cellComp.addOrRemoveCssClass(CSS_NORMAL_HEIGHT, !autoHeight);
  }
  onColumnHover() {
    if (!this.cellComp) {
      return;
    }
    if (!this.beans.gridOptionsService.get('columnHoverHighlight')) {
      return;
    }
    const isHovered = this.beans.columnHoverService.isHovered(this.column);
    this.cellComp.addOrRemoveCssClass(CSS_COLUMN_HOVER, isHovered);
  }
  onColDefChanged() {
    var _a, _b;
    if (!this.cellComp) {
      return;
    }
    const isAutoHeight = this.column.isAutoHeight();
    if (isAutoHeight !== this.isAutoHeight) {
      (_a = this.rowCtrl) === null || _a === void 0 ? void 0 : _a.refreshCell(this);
    }
    const isTooltipEnabled = this.column.isTooltipEnabled();
    if (isTooltipEnabled) {
      this.disableTooltipFeature();
      this.enableTooltipFeature();
      (_b = this.tooltipFeature) === null || _b === void 0 ? void 0 : _b.setComp(this.eGui);
    } else {
      this.disableTooltipFeature();
    }
    this.setWrapText();
    if (!this.editing) {
      this.refreshOrDestroyCell({
        forceRefresh: true,
        suppressFlash: true
      });
    }
  }
  setWrapText() {
    const value = this.column.getColDef().wrapText == true;
    this.cellComp.addOrRemoveCssClass(CSS_CELL_WRAP_TEXT, value);
  }
  dispatchCellContextMenuEvent(event) {
    const colDef = this.column.getColDef();
    const cellContextMenuEvent = this.createEvent(event, Events.EVENT_CELL_CONTEXT_MENU);
    this.beans.eventService.dispatchEvent(cellContextMenuEvent);
    if (colDef.onCellContextMenu) {
      window.setTimeout(() => colDef.onCellContextMenu(cellContextMenuEvent), 0);
    }
  }
  getCellRenderer() {
    return this.cellComp ? this.cellComp.getCellRenderer() : null;
  }
  getCellEditor() {
    return this.cellComp ? this.cellComp.getCellEditor() : null;
  }
  destroy() {
    this.onCellCompAttachedFuncs = [];
    super.destroy();
  }
  createSelectionCheckbox() {
    const cbSelectionComponent = new CheckboxSelectionComponent();
    this.beans.context.createBean(cbSelectionComponent);
    cbSelectionComponent.init({
      rowNode: this.rowNode,
      column: this.column
    });
    return cbSelectionComponent;
  }
  createDndSource() {
    const dndSourceComp = new DndSourceComp(this.rowNode, this.column, this.eGui);
    this.beans.context.createBean(dndSourceComp);
    return dndSourceComp;
  }
  registerRowDragger(customElement, dragStartPixels, suppressVisibilityChange) {
    if (this.customRowDragComp) {
      this.customRowDragComp.setDragElement(customElement, dragStartPixels);
      return;
    }
    const newComp = this.createRowDragComp(customElement, dragStartPixels, suppressVisibilityChange);
    if (newComp) {
      this.customRowDragComp = newComp;
      this.addDestroyFunc(() => {
        this.beans.context.destroyBean(newComp);
        this.customRowDragComp = null;
      });
    }
  }
  createRowDragComp(customElement, dragStartPixels, suppressVisibilityChange) {
    const pagination = this.beans.gridOptionsService.get('pagination');
    const rowDragManaged = this.beans.gridOptionsService.get('rowDragManaged');
    const clientSideRowModelActive = this.beans.gridOptionsService.isRowModelType('clientSide');
    if (rowDragManaged) {
      if (!clientSideRowModelActive) {
        warnOnce('managed row dragging is only allowed in the Client Side Row Model');
        return;
      }
      if (pagination) {
        warnOnce('managed row dragging is not possible when doing pagination');
        return;
      }
    }
    const rowDragComp = new RowDragComp(() => this.value, this.rowNode, this.column, customElement, dragStartPixels, suppressVisibilityChange);
    this.beans.context.createBean(rowDragComp);
    return rowDragComp;
  }
}
CellCtrl.DOM_DATA_KEY_CELL_CTRL = 'cellCtrl';
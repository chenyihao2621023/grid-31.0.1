import { Component } from "../../widgets/component";
import { PopupEditorWrapper } from "./../cellEditors/popupEditorWrapper";
import { setAriaRole } from "../../utils/aria";
import { escapeString } from "../../utils/string";
import { missing } from "../../utils/generic";
import { addStylesToElement, clearElement, loadTemplate, removeFromParent } from "../../utils/dom";
import { browserSupportsPreventScroll } from "../../utils/browser";
export class CellComp extends Component {
  constructor(beans, cellCtrl, printLayout, eRow, editingRow) {
    super();
    this.rendererVersion = 0;
    this.editorVersion = 0;
    this.beans = beans;
    this.column = cellCtrl.getColumn();
    this.rowNode = cellCtrl.getRowNode();
    this.rowCtrl = cellCtrl.getRowCtrl();
    this.eRow = eRow;
    this.cellCtrl = cellCtrl;
    this.setTemplate(`<div comp-id="${this.getCompId()}"/>`);
    const eGui = this.getGui();
    this.forceWrapper = cellCtrl.isForceWrapper();
    this.refreshWrapper(false);
    const setAttribute = (name, value) => {
      if (value != null && value != '') {
        eGui.setAttribute(name, value);
      } else {
        eGui.removeAttribute(name);
      }
    };
    setAriaRole(eGui, cellCtrl.getCellAriaRole());
    setAttribute('col-id', cellCtrl.getColumnIdSanitised());
    const tabIndex = cellCtrl.getTabIndex();
    if (tabIndex !== undefined) {
      setAttribute('tabindex', tabIndex.toString());
    }
    const compProxy = {
      addOrRemoveCssClass: (cssClassName, on) => this.addOrRemoveCssClass(cssClassName, on),
      setUserStyles: styles => addStylesToElement(eGui, styles),
      getFocusableElement: () => this.getFocusableElement(),
      setIncludeSelection: include => this.includeSelection = include,
      setIncludeRowDrag: include => this.includeRowDrag = include,
      setIncludeDndSource: include => this.includeDndSource = include,
      setRenderDetails: (compDetails, valueToDisplay, force) => this.setRenderDetails(compDetails, valueToDisplay, force),
      setEditDetails: (compDetails, popup, position) => this.setEditDetails(compDetails, popup, position),
      getCellEditor: () => this.cellEditor || null,
      getCellRenderer: () => this.cellRenderer || null,
      getParentOfValue: () => this.getParentOfValue()
    };
    cellCtrl.setComp(compProxy, this.getGui(), this.eCellWrapper, printLayout, editingRow);
  }
  getParentOfValue() {
    if (this.eCellValue) {
      return this.eCellValue;
    }
    if (this.eCellWrapper) {
      return this.eCellWrapper;
    }
    return this.getGui();
  }
  setRenderDetails(compDetails, valueToDisplay, forceNewCellRendererInstance) {
    const isInlineEditing = this.cellEditor && !this.cellEditorPopupWrapper;
    if (isInlineEditing) {
      return;
    }
    this.firstRender = this.firstRender == null;
    const controlWrapperChanged = this.refreshWrapper(false);
    this.refreshEditStyles(false);
    if (compDetails) {
      const neverRefresh = forceNewCellRendererInstance || controlWrapperChanged;
      const cellRendererRefreshSuccessful = neverRefresh ? false : this.refreshCellRenderer(compDetails);
      if (!cellRendererRefreshSuccessful) {
        this.destroyRenderer();
        this.createCellRendererInstance(compDetails);
      }
    } else {
      this.destroyRenderer();
      this.insertValueWithoutCellRenderer(valueToDisplay);
    }
  }
  setEditDetails(compDetails, popup, position) {
    if (compDetails) {
      this.createCellEditorInstance(compDetails, popup, position);
    } else {
      this.destroyEditor();
    }
  }
  removeControls() {
    this.checkboxSelectionComp = this.beans.context.destroyBean(this.checkboxSelectionComp);
    this.dndSourceComp = this.beans.context.destroyBean(this.dndSourceComp);
    this.rowDraggingComp = this.beans.context.destroyBean(this.rowDraggingComp);
  }
  refreshWrapper(editing) {
    const providingControls = this.includeRowDrag || this.includeDndSource || this.includeSelection;
    const usingWrapper = providingControls || this.forceWrapper;
    const putWrapperIn = usingWrapper && this.eCellWrapper == null;
    if (putWrapperIn) {
      this.eCellWrapper = loadTemplate(`<div class="zing-cell-wrapper" role="presentation"></div>`);
      this.getGui().appendChild(this.eCellWrapper);
    }
    const takeWrapperOut = !usingWrapper && this.eCellWrapper != null;
    if (takeWrapperOut) {
      removeFromParent(this.eCellWrapper);
      this.eCellWrapper = undefined;
    }
    this.addOrRemoveCssClass('zing-cell-value', !usingWrapper);
    const usingCellValue = !editing && usingWrapper;
    const putCellValueIn = usingCellValue && this.eCellValue == null;
    if (putCellValueIn) {
      this.eCellValue = loadTemplate(`<span class="zing-cell-value" role="presentation"></span>`);
      this.eCellWrapper.appendChild(this.eCellValue);
    }
    const takeCellValueOut = !usingCellValue && this.eCellValue != null;
    if (takeCellValueOut) {
      removeFromParent(this.eCellValue);
      this.eCellValue = undefined;
    }
    const templateChanged = putWrapperIn || takeWrapperOut || putCellValueIn || takeCellValueOut;
    if (templateChanged) {
      this.removeControls();
    }
    if (!editing) {
      if (providingControls) {
        this.addControls();
      }
    }
    return templateChanged;
  }
  addControls() {
    if (this.includeRowDrag) {
      if (this.rowDraggingComp == null) {
        this.rowDraggingComp = this.cellCtrl.createRowDragComp();
        if (this.rowDraggingComp) {
          this.eCellWrapper.insertBefore(this.rowDraggingComp.getGui(), this.eCellValue);
        }
      }
    }
    if (this.includeDndSource) {
      if (this.dndSourceComp == null) {
        this.dndSourceComp = this.cellCtrl.createDndSource();
        this.eCellWrapper.insertBefore(this.dndSourceComp.getGui(), this.eCellValue);
      }
    }
    if (this.includeSelection) {
      if (this.checkboxSelectionComp == null) {
        this.checkboxSelectionComp = this.cellCtrl.createSelectionCheckbox();
        this.eCellWrapper.insertBefore(this.checkboxSelectionComp.getGui(), this.eCellValue);
      }
    }
  }
  createCellEditorInstance(compDetails, popup, position) {
    const versionCopy = this.editorVersion;
    const cellEditorPromise = compDetails.newZingStackInstance();
    if (!cellEditorPromise) {
      return;
    }
    const {
      params
    } = compDetails;
    cellEditorPromise.then(c => this.afterCellEditorCreated(versionCopy, c, params, popup, position));
    const cellEditorAsync = missing(this.cellEditor);
    if (cellEditorAsync && params.cellStartedEdit) {
      this.cellCtrl.focusCell(true);
    }
  }
  insertValueWithoutCellRenderer(valueToDisplay) {
    const eParent = this.getParentOfValue();
    clearElement(eParent);
    const escapedValue = valueToDisplay != null ? escapeString(valueToDisplay) : null;
    if (escapedValue != null) {
      eParent.innerHTML = escapedValue;
    }
  }
  destroyEditorAndRenderer() {
    this.destroyRenderer();
    this.destroyEditor();
  }
  destroyRenderer() {
    const {
      context
    } = this.beans;
    this.cellRenderer = context.destroyBean(this.cellRenderer);
    removeFromParent(this.cellRendererGui);
    this.cellRendererGui = null;
    this.rendererVersion++;
  }
  destroyEditor() {
    const {
      context
    } = this.beans;
    if (this.hideEditorPopup) {
      this.hideEditorPopup();
    }
    this.hideEditorPopup = undefined;
    this.cellEditor = context.destroyBean(this.cellEditor);
    this.cellEditorPopupWrapper = context.destroyBean(this.cellEditorPopupWrapper);
    removeFromParent(this.cellEditorGui);
    this.cellEditorGui = null;
    this.editorVersion++;
  }
  refreshCellRenderer(compClassAndParams) {
    if (this.cellRenderer == null || this.cellRenderer.refresh == null) {
      return false;
    }
    if (this.cellRendererClass !== compClassAndParams.componentClass) {
      return false;
    }
    const result = this.cellRenderer.refresh(compClassAndParams.params);
    return result === true || result === undefined;
  }
  createCellRendererInstance(compDetails) {
    const suppressAnimationFrame = this.beans.gridOptionsService.get('suppressAnimationFrame');
    const useTaskService = !suppressAnimationFrame;
    const displayComponentVersionCopy = this.rendererVersion;
    const {
      componentClass
    } = compDetails;
    const createCellRendererFunc = () => {
      const staleTask = this.rendererVersion !== displayComponentVersionCopy || !this.isAlive();
      if (staleTask) {
        return;
      }
      const componentPromise = compDetails.newZingStackInstance();
      const callback = this.afterCellRendererCreated.bind(this, displayComponentVersionCopy, componentClass);
      if (componentPromise) {
        componentPromise.then(callback);
      }
    };
    if (useTaskService && this.firstRender) {
      this.beans.animationFrameService.createTask(createCellRendererFunc, this.rowNode.rowIndex, 'createTasksP2');
    } else {
      createCellRendererFunc();
    }
  }
  getCtrl() {
    return this.cellCtrl;
  }
  getRowCtrl() {
    return this.rowCtrl;
  }
  getCellRenderer() {
    return this.cellRenderer;
  }
  getCellEditor() {
    return this.cellEditor;
  }
  afterCellRendererCreated(cellRendererVersion, cellRendererClass, cellRenderer) {
    const staleTask = !this.isAlive() || cellRendererVersion !== this.rendererVersion;
    if (staleTask) {
      this.beans.context.destroyBean(cellRenderer);
      return;
    }
    this.cellRenderer = cellRenderer;
    this.cellRendererClass = cellRendererClass;
    this.cellRendererGui = this.cellRenderer.getGui();
    if (this.cellRendererGui != null) {
      const eParent = this.getParentOfValue();
      clearElement(eParent);
      eParent.appendChild(this.cellRendererGui);
    }
  }
  afterCellEditorCreated(requestVersion, cellEditor, params, popup, position) {
    const staleComp = requestVersion !== this.editorVersion;
    if (staleComp) {
      this.beans.context.destroyBean(cellEditor);
      return;
    }
    const editingCancelledByUserComp = cellEditor.isCancelBeforeStart && cellEditor.isCancelBeforeStart();
    if (editingCancelledByUserComp) {
      this.beans.context.destroyBean(cellEditor);
      this.cellCtrl.stopEditing(true);
      return;
    }
    if (!cellEditor.getGui) {
      console.warn(`ZING Grid: cellEditor for column ${this.column.getId()} is missing getGui() method`);
      this.beans.context.destroyBean(cellEditor);
      return;
    }
    this.cellEditor = cellEditor;
    this.cellEditorGui = cellEditor.getGui();
    const cellEditorInPopup = popup || cellEditor.isPopup !== undefined && cellEditor.isPopup();
    if (cellEditorInPopup) {
      this.addPopupCellEditor(params, position);
    } else {
      this.addInCellEditor();
    }
    this.refreshEditStyles(true, cellEditorInPopup);
    if (cellEditor.afterGuiAttached) {
      cellEditor.afterGuiAttached();
    }
  }
  refreshEditStyles(editing, isPopup) {
    var _a;
    this.addOrRemoveCssClass('zing-cell-inline-editing', editing && !isPopup);
    this.addOrRemoveCssClass('zing-cell-popup-editing', editing && !!isPopup);
    this.addOrRemoveCssClass('zing-cell-not-inline-editing', !editing || !!isPopup);
    (_a = this.rowCtrl) === null || _a === void 0 ? void 0 : _a.setInlineEditingCss(editing);
  }
  addInCellEditor() {
    const eGui = this.getGui();
    const eDocument = this.beans.gridOptionsService.getDocument();
    if (eGui.contains(eDocument.activeElement)) {
      eGui.focus();
    }
    this.destroyRenderer();
    this.refreshWrapper(true);
    this.clearParentOfValue();
    if (this.cellEditorGui) {
      const eParent = this.getParentOfValue();
      eParent.appendChild(this.cellEditorGui);
    }
  }
  addPopupCellEditor(params, position) {
    if (this.beans.gridOptionsService.get('editType') === 'fullRow') {
      console.warn('ZING Grid: popup cellEditor does not work with fullRowEdit - you cannot use them both ' + '- either turn off fullRowEdit, or stop using popup editors.');
    }
    const cellEditor = this.cellEditor;
    this.cellEditorPopupWrapper = this.beans.context.createBean(new PopupEditorWrapper(params));
    const ePopupGui = this.cellEditorPopupWrapper.getGui();
    if (this.cellEditorGui) {
      ePopupGui.appendChild(this.cellEditorGui);
    }
    const popupService = this.beans.popupService;
    const useModelPopup = this.beans.gridOptionsService.get('stopEditingWhenCellsLoseFocus');
    const positionToUse = position != null ? position : cellEditor.getPopupPosition ? cellEditor.getPopupPosition() : 'over';
    const isRtl = this.beans.gridOptionsService.get('enableRtl');
    const positionParams = {
      ePopup: ePopupGui,
      column: this.column,
      rowNode: this.rowNode,
      type: 'popupCellEditor',
      eventSource: this.getGui(),
      position: positionToUse,
      alignSide: isRtl ? 'right' : 'left',
      keepWithinBounds: true
    };
    const positionCallback = popupService.positionPopupByComponent.bind(popupService, positionParams);
    const translate = this.beans.localeService.getLocaleTextFunc();
    const addPopupRes = popupService.addPopup({
      modal: useModelPopup,
      eChild: ePopupGui,
      closeOnEsc: true,
      closedCallback: () => {
        this.cellCtrl.onPopupEditorClosed();
      },
      anchorToElement: this.getGui(),
      positionCallback,
      ariaLabel: translate('ariaLabelCellEditor', 'Cell Editor')
    });
    if (addPopupRes) {
      this.hideEditorPopup = addPopupRes.hideFunc;
    }
  }
  detach() {
    this.eRow.removeChild(this.getGui());
  }
  destroy() {
    this.cellCtrl.stopEditing();
    this.destroyEditorAndRenderer();
    this.removeControls();
    super.destroy();
  }
  clearParentOfValue() {
    const eGui = this.getGui();
    const eDocument = this.beans.gridOptionsService.getDocument();
    if (eGui.contains(eDocument.activeElement) && browserSupportsPreventScroll()) {
      eGui.focus({
        preventScroll: true
      });
    }
    clearElement(this.getParentOfValue());
  }
}
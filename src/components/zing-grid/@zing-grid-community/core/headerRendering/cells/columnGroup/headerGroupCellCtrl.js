var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { KeyCode } from '../../../constants/keyCode';
import { Autowired } from "../../../context/context";
import { DragAndDropService, DragSourceType } from "../../../dragAndDrop/dragAndDropService";
import { Column } from "../../../entities/column";
import { Events } from "../../../events";
import { ProvidedColumnGroup } from "../../../entities/providedColumnGroup";
import { SetLeftFeature } from "../../../rendering/features/setLeftFeature";
import { last, removeFromArray } from "../../../utils/array";
import { ManagedFocusFeature } from "../../../widgets/managedFocusFeature";
import { TooltipFeature } from "../../../widgets/tooltipFeature";
import { AbstractHeaderCellCtrl } from "../abstractCell/abstractHeaderCellCtrl";
import { CssClassApplier } from "../cssClassApplier";
import { HoverFeature } from "../hoverFeature";
import { GroupResizeFeature } from "./groupResizeFeature";
import { GroupWidthFeature } from "./groupWidthFeature";
import { HorizontalDirection } from "../../../constants/direction";
import { ColumnMoveHelper } from "../../columnMoveHelper";
export class HeaderGroupCellCtrl extends AbstractHeaderCellCtrl {
  constructor(columnGroup, parentRowCtrl) {
    super(columnGroup, parentRowCtrl);
    this.onSuppressColMoveChange = () => {
      if (this.isSuppressMoving()) {
        this.removeDragSource();
      } else {
        if (!this.dragSource) {
          const eGui = this.getGui();
          this.setDragSource(eGui);
        }
      }
    };
    this.column = columnGroup;
  }
  setComp(comp, eGui, eResize) {
    this.comp = comp;
    this.setGui(eGui);
    this.displayName = this.columnModel.getDisplayNameForColumnGroup(this.column, 'header');
    this.addClasses();
    this.setupMovingCss();
    this.setupExpandable();
    this.setupTooltip();
    this.setupUserComp();
    const pinned = this.getParentRowCtrl().getPinned();
    const leafCols = this.column.getProvidedColumnGroup().getLeafColumns();
    this.createManagedBean(new HoverFeature(leafCols, eGui));
    this.createManagedBean(new SetLeftFeature(this.column, eGui, this.beans));
    this.createManagedBean(new GroupWidthFeature(comp, this.column));
    this.resizeFeature = this.createManagedBean(new GroupResizeFeature(comp, eResize, pinned, this.column));
    this.createManagedBean(new ManagedFocusFeature(eGui, {
      shouldStopEventPropagation: this.shouldStopEventPropagation.bind(this),
      onTabKeyDown: () => undefined,
      handleKeyDown: this.handleKeyDown.bind(this),
      onFocusIn: this.onFocusIn.bind(this)
    }));
    this.addManagedPropertyListener(Events.EVENT_SUPPRESS_COLUMN_MOVE_CHANGED, this.onSuppressColMoveChange);
    this.addResizeAndMoveKeyboardListeners();
  }
  resizeHeader(direction, shiftKey) {
    if (!this.resizeFeature) {
      return;
    }
    const isLeft = direction === HorizontalDirection.Left;
    const diff = (isLeft ? -1 : 1) * this.resizeMultiplier;
    const initialValues = this.resizeFeature.getInitialValues(shiftKey);
    this.resizeFeature.resizeColumns(initialValues, initialValues.resizeStartWidth + diff, 'uiColumnResized', true);
  }
  moveHeader(hDirection) {
    const {
      eGui,
      column,
      columnModel,
      gridOptionsService,
      ctrlsService
    } = this;
    const isRtl = gridOptionsService.get('enableRtl');
    const isLeft = hDirection === HorizontalDirection.Left;
    const pinned = this.getPinned();
    const rect = eGui.getBoundingClientRect();
    const left = rect.left;
    const width = rect.width;
    const xPosition = ColumnMoveHelper.normaliseX(isLeft !== isRtl ? left - 20 : left + width + 20, pinned, true, gridOptionsService, ctrlsService);
    const id = column.getGroupId();
    const headerPosition = this.focusService.getFocusedHeader();
    ColumnMoveHelper.attemptMoveColumns({
      allMovingColumns: this.column.getLeafColumns(),
      isFromHeader: true,
      hDirection,
      xPosition,
      pinned,
      fromEnter: false,
      fakeEvent: false,
      gridOptionsService: gridOptionsService,
      columnModel
    });
    const displayedLeafColumns = column.getDisplayedLeafColumns();
    const targetColumn = isLeft ? displayedLeafColumns[0] : last(displayedLeafColumns);
    this.ctrlsService.getGridBodyCtrl().getScrollFeature().ensureColumnVisible(targetColumn, 'auto');
    if (!this.isAlive() && headerPosition) {
      this.restoreFocus(id, column, headerPosition);
    }
  }
  restoreFocus(groupId, previousColumnGroup, previousPosition) {
    const leafCols = previousColumnGroup.getLeafColumns();
    if (!leafCols.length) {
      return;
    }
    const parent = leafCols[0].getParent();
    if (!parent) {
      return;
    }
    const newColumnGroup = this.findGroupWidthId(parent, groupId);
    if (newColumnGroup) {
      this.focusService.focusHeaderPosition({
        headerPosition: Object.assign(Object.assign({}, previousPosition), {
          column: newColumnGroup
        })
      });
    }
  }
  findGroupWidthId(columnGroup, id) {
    while (columnGroup) {
      if (columnGroup.getGroupId() === id) {
        return columnGroup;
      }
      columnGroup = columnGroup.getParent();
    }
    return null;
  }
  resizeLeafColumnsToFit(source) {
    if (!this.resizeFeature) {
      return;
    }
    this.resizeFeature.resizeLeafColumnsToFit(source);
  }
  setupUserComp() {
    const params = {
      displayName: this.displayName,
      columnGroup: this.column,
      setExpanded: expanded => {
        this.columnModel.setColumnGroupOpened(this.column.getProvidedColumnGroup(), expanded, "gridInitializing");
      },
      api: this.gridOptionsService.api,
      columnApi: this.gridOptionsService.columnApi,
      context: this.gridOptionsService.context
    };
    const compDetails = this.userComponentFactory.getHeaderGroupCompDetails(params);
    this.comp.setUserCompDetails(compDetails);
  }
  setupTooltip() {
    const colGroupDef = this.column.getColGroupDef();
    const tooltipCtrl = {
      getColumn: () => this.column,
      getGui: () => this.eGui,
      getLocation: () => 'headerGroup',
      getTooltipValue: () => colGroupDef && colGroupDef.headerTooltip
    };
    if (colGroupDef) {
      tooltipCtrl.getColDef = () => colGroupDef;
    }
    const tooltipFeature = this.createManagedBean(new TooltipFeature(tooltipCtrl, this.beans));
    tooltipFeature.setComp(this.eGui);
  }
  setupExpandable() {
    const providedColGroup = this.column.getProvidedColumnGroup();
    this.refreshExpanded();
    this.addManagedListener(providedColGroup, ProvidedColumnGroup.EVENT_EXPANDABLE_CHANGED, this.refreshExpanded.bind(this));
    this.addManagedListener(providedColGroup, ProvidedColumnGroup.EVENT_EXPANDED_CHANGED, this.refreshExpanded.bind(this));
  }
  refreshExpanded() {
    const column = this.column;
    this.expandable = column.isExpandable();
    const expanded = column.isExpanded();
    if (this.expandable) {
      this.comp.setAriaExpanded(expanded ? 'true' : 'false');
    } else {
      this.comp.setAriaExpanded(undefined);
    }
  }
  getColId() {
    return this.column.getUniqueId();
  }
  addClasses() {
    const colGroupDef = this.column.getColGroupDef();
    const classes = CssClassApplier.getHeaderClassesFromColDef(colGroupDef, this.gridOptionsService, null, this.column);
    if (this.column.isPadding()) {
      classes.push('zing-header-group-cell-no-group');
      const leafCols = this.column.getLeafColumns();
      if (leafCols.every(col => col.isSpanHeaderHeight())) {
        classes.push('zing-header-span-height');
      }
    } else {
      classes.push('zing-header-group-cell-with-group');
    }
    classes.forEach(c => this.comp.addOrRemoveCssClass(c, true));
  }
  setupMovingCss() {
    const providedColumnGroup = this.column.getProvidedColumnGroup();
    const leafColumns = providedColumnGroup.getLeafColumns();
    const listener = () => this.comp.addOrRemoveCssClass('zing-header-cell-moving', this.column.isMoving());
    leafColumns.forEach(col => {
      this.addManagedListener(col, Column.EVENT_MOVING_CHANGED, listener);
    });
    listener();
  }
  onFocusIn(e) {
    if (!this.eGui.contains(e.relatedTarget)) {
      const rowIndex = this.getRowIndex();
      this.beans.focusService.setFocusedHeader(rowIndex, this.column);
    }
  }
  handleKeyDown(e) {
    super.handleKeyDown(e);
    const wrapperHasFocus = this.getWrapperHasFocus();
    if (!this.expandable || !wrapperHasFocus) {
      return;
    }
    if (e.key === KeyCode.ENTER) {
      const column = this.column;
      const newExpandedValue = !column.isExpanded();
      this.columnModel.setColumnGroupOpened(column.getProvidedColumnGroup(), newExpandedValue, "uiColumnExpanded");
    }
  }
  setDragSource(eHeaderGroup) {
    if (this.isSuppressMoving()) {
      return;
    }
    this.removeDragSource();
    if (!eHeaderGroup) {
      return;
    }
    const {
      column,
      columnModel,
      displayName,
      gridOptionsService,
      dragAndDropService
    } = this;
    const allLeafColumns = column.getProvidedColumnGroup().getLeafColumns();
    let hideColumnOnExit = !gridOptionsService.get('suppressDragLeaveHidesColumns');
    const dragSource = this.dragSource = {
      type: DragSourceType.HeaderCell,
      eElement: eHeaderGroup,
      getDefaultIconName: () => hideColumnOnExit ? DragAndDropService.ICON_HIDE : DragAndDropService.ICON_NOT_ALLOWED,
      dragItemName: displayName,
      getDragItem: () => this.getDragItemForGroup(column),
      onDragStarted: () => {
        hideColumnOnExit = !gridOptionsService.get('suppressDragLeaveHidesColumns');
        allLeafColumns.forEach(col => col.setMoving(true, "uiColumnDragged"));
      },
      onDragStopped: () => allLeafColumns.forEach(col => col.setMoving(false, "uiColumnDragged")),
      onGridEnter: dragItem => {
        var _a;
        if (hideColumnOnExit) {
          const unlockedColumns = ((_a = dragItem === null || dragItem === void 0 ? void 0 : dragItem.columns) === null || _a === void 0 ? void 0 : _a.filter(col => !col.getColDef().lockVisible)) || [];
          columnModel.setColumnsVisible(unlockedColumns, true, "uiColumnMoved");
        }
      },
      onGridExit: dragItem => {
        var _a;
        if (hideColumnOnExit) {
          const unlockedColumns = ((_a = dragItem === null || dragItem === void 0 ? void 0 : dragItem.columns) === null || _a === void 0 ? void 0 : _a.filter(col => !col.getColDef().lockVisible)) || [];
          columnModel.setColumnsVisible(unlockedColumns, false, "uiColumnMoved");
        }
      }
    };
    dragAndDropService.addDragSource(dragSource, true);
  }
  getDragItemForGroup(columnGroup) {
    const allColumnsOriginalOrder = columnGroup.getProvidedColumnGroup().getLeafColumns();
    const visibleState = {};
    allColumnsOriginalOrder.forEach(column => visibleState[column.getId()] = column.isVisible());
    const allColumnsCurrentOrder = [];
    this.columnModel.getAllDisplayedColumns().forEach(column => {
      if (allColumnsOriginalOrder.indexOf(column) >= 0) {
        allColumnsCurrentOrder.push(column);
        removeFromArray(allColumnsOriginalOrder, column);
      }
    });
    allColumnsOriginalOrder.forEach(column => allColumnsCurrentOrder.push(column));
    return {
      columns: allColumnsCurrentOrder,
      visibleState: visibleState
    };
  }
  isSuppressMoving() {
    let childSuppressesMoving = false;
    this.column.getLeafColumns().forEach(column => {
      if (column.getColDef().suppressMovable || column.getColDef().lockPosition) {
        childSuppressesMoving = true;
      }
    });
    const result = childSuppressesMoving || this.gridOptionsService.get('suppressMovableColumns');
    return result;
  }
}
__decorate([Autowired('columnModel')], HeaderGroupCellCtrl.prototype, "columnModel", void 0);
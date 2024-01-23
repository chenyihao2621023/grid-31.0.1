var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Bean } from "../context/context";
import { Column } from "../entities/column";
import { BeanStub } from "../context/beanStub";
import { mergeDeep } from "../utils/object";
import { missing } from "../utils/generic";
export const GROUP_AUTO_COLUMN_ID = 'zing-Grid-AutoColumn';
let AutoGroupColService = class AutoGroupColService extends BeanStub {
  createAutoGroupColumns(rowGroupColumns) {
    const groupAutoColumns = [];
    const doingTreeData = this.gridOptionsService.get('treeData');
    let doingMultiAutoColumn = this.gridOptionsService.isGroupMultiAutoColumn();
    if (doingTreeData && doingMultiAutoColumn) {
      console.warn('ZING Grid: you cannot mix groupDisplayType = "multipleColumns" with treeData, only one column can be used to display groups when doing tree data');
      doingMultiAutoColumn = false;
    }
    if (doingMultiAutoColumn) {
      rowGroupColumns.forEach((rowGroupCol, index) => {
        groupAutoColumns.push(this.createOneAutoGroupColumn(rowGroupCol, index));
      });
    } else {
      groupAutoColumns.push(this.createOneAutoGroupColumn());
    }
    return groupAutoColumns;
  }
  updateAutoGroupColumns(autoGroupColumns) {
    autoGroupColumns.forEach((column, index) => this.updateOneAutoGroupColumn(column, index));
  }
  createOneAutoGroupColumn(rowGroupCol, index) {
    let colId;
    if (rowGroupCol) {
      colId = `${GROUP_AUTO_COLUMN_ID}-${rowGroupCol.getId()}`;
    } else {
      colId = GROUP_AUTO_COLUMN_ID;
    }
    const colDef = this.createAutoGroupColDef(colId, rowGroupCol, index);
    colDef.colId = colId;
    const newCol = new Column(colDef, null, colId, true);
    this.context.createBean(newCol);
    return newCol;
  }
  updateOneAutoGroupColumn(colToUpdate, index) {
    const oldColDef = colToUpdate.getColDef();
    const underlyingColId = typeof oldColDef.showRowGroup == 'string' ? oldColDef.showRowGroup : undefined;
    const underlyingColumn = underlyingColId != null ? this.columnModel.getPrimaryColumn(underlyingColId) : undefined;
    const colDef = this.createAutoGroupColDef(colToUpdate.getId(), underlyingColumn !== null && underlyingColumn !== void 0 ? underlyingColumn : undefined, index);
    colToUpdate.setColDef(colDef, null);
    this.columnFactory.applyColumnState(colToUpdate, colDef);
  }
  createAutoGroupColDef(colId, underlyingColumn, index) {
    let res = this.createBaseColDef(underlyingColumn);
    const autoGroupColumnDef = this.gridOptionsService.get('autoGroupColumnDef');
    mergeDeep(res, autoGroupColumnDef);
    res = this.columnFactory.addColumnDefaultAndTypes(res, colId);
    if (!this.gridOptionsService.get('treeData')) {
      const noFieldOrValueGetter = missing(res.field) && missing(res.valueGetter) && missing(res.filterValueGetter) && res.filter !== 'zingGroupColumnFilter';
      if (noFieldOrValueGetter) {
        res.filter = false;
      }
    }
    if (index && index > 0) {
      res.headerCheckboxSelection = false;
    }
    const isSortingCoupled = this.gridOptionsService.isColumnsSortingCoupledToGroup();
    const hasOwnData = res.valueGetter || res.field != null;
    if (isSortingCoupled && !hasOwnData) {
      res.sortIndex = undefined;
      res.initialSort = undefined;
    }
    return res;
  }
  createBaseColDef(rowGroupCol) {
    const userDef = this.gridOptionsService.get('autoGroupColumnDef');
    const localeTextFunc = this.localeService.getLocaleTextFunc();
    const res = {
      headerName: localeTextFunc('group', 'Group')
    };
    const userHasProvidedGroupCellRenderer = userDef && (userDef.cellRenderer || userDef.cellRendererSelector);
    if (!userHasProvidedGroupCellRenderer) {
      res.cellRenderer = 'zingGroupCellRenderer';
    }
    if (rowGroupCol) {
      const colDef = rowGroupCol.getColDef();
      Object.assign(res, {
        headerName: this.columnModel.getDisplayNameForColumn(rowGroupCol, 'header'),
        headerValueGetter: colDef.headerValueGetter
      });
      if (colDef.cellRenderer) {
        Object.assign(res, {
          cellRendererParams: {
            innerRenderer: colDef.cellRenderer,
            innerRendererParams: colDef.cellRendererParams
          }
        });
      }
      res.showRowGroup = rowGroupCol.getColId();
    } else {
      res.showRowGroup = true;
    }
    return res;
  }
};
__decorate([Autowired('columnModel')], AutoGroupColService.prototype, "columnModel", void 0);
__decorate([Autowired('columnFactory')], AutoGroupColService.prototype, "columnFactory", void 0);
AutoGroupColService = __decorate([Bean('autoGroupColService')], AutoGroupColService);
export { AutoGroupColService };
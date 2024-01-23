var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PivotColDefService_1;
import { Autowired, Bean, BeanStub, PostConstruct, _ } from "@/components/zing-grid/@zing-grid-community/core/main.js";
let PivotColDefService = PivotColDefService_1 = class PivotColDefService extends BeanStub {
  init() {
    const getFieldSeparator = () => {
      var _a;
      return (_a = this.gos.get('serverSidePivotResultFieldSeparator')) !== null && _a !== void 0 ? _a : '_';
    };
    this.fieldSeparator = getFieldSeparator();
    this.addManagedPropertyListener('serverSidePivotResultFieldSeparator', () => {
      this.fieldSeparator = getFieldSeparator();
    });
    const getPivotDefaultExpanded = () => this.gos.get('pivotDefaultExpanded');
    this.pivotDefaultExpanded = getPivotDefaultExpanded();
    this.addManagedPropertyListener('pivotDefaultExpanded', () => {
      this.pivotDefaultExpanded = getPivotDefaultExpanded();
    });
  }
  createPivotColumnDefs(uniqueValues) {
    const pivotColumnGroupDefs = this.createPivotColumnsFromUniqueValues(uniqueValues);
    function extractColDefs(input, arr = []) {
      input.forEach(def => {
        if (def.children !== undefined) {
          extractColDefs(def.children, arr);
        } else {
          arr.push(def);
        }
      });
      return arr;
    }
    const pivotColumnDefs = extractColDefs(pivotColumnGroupDefs);
    this.addRowGroupTotals(pivotColumnGroupDefs, pivotColumnDefs);
    this.addExpandablePivotGroups(pivotColumnGroupDefs, pivotColumnDefs);
    this.addPivotTotalsToGroups(pivotColumnGroupDefs, pivotColumnDefs);
    const pivotColumnDefsClone = pivotColumnDefs.map(colDef => _.cloneObject(colDef));
    return {
      pivotColumnGroupDefs: pivotColumnGroupDefs,
      pivotColumnDefs: pivotColumnDefsClone
    };
  }
  createPivotColumnsFromUniqueValues(uniqueValues) {
    const pivotColumns = this.columnModel.getPivotColumns();
    const maxDepth = pivotColumns.length;
    const pivotColumnGroupDefs = this.recursivelyBuildGroup(0, uniqueValues, [], maxDepth, pivotColumns);
    return pivotColumnGroupDefs;
  }
  recursivelyBuildGroup(index, uniqueValue, pivotKeys, maxDepth, primaryPivotColumns) {
    const measureColumns = this.columnModel.getValueColumns();
    if (index >= maxDepth) {
      return this.buildMeasureCols(pivotKeys);
    }
    const primaryPivotColumnDefs = primaryPivotColumns[index].getColDef();
    const comparator = this.headerNameComparator.bind(this, primaryPivotColumnDefs.pivotComparator);
    if (measureColumns.length === 1 && this.gridOptionsService.get('removePivotHeaderRowWhenSingleValueColumn') && index === maxDepth - 1) {
      const leafCols = [];
      _.iterateObject(uniqueValue, key => {
        const newPivotKeys = [...pivotKeys, key];
        const colDef = this.createColDef(measureColumns[0], key, newPivotKeys);
        colDef.columnGroupShow = 'open';
        leafCols.push(colDef);
      });
      leafCols.sort(comparator);
      return leafCols;
    }
    const groups = [];
    _.iterateObject(uniqueValue, (key, value) => {
      const openByDefault = this.pivotDefaultExpanded === -1 || index < this.pivotDefaultExpanded;
      const newPivotKeys = [...pivotKeys, key];
      groups.push({
        children: this.recursivelyBuildGroup(index + 1, value, newPivotKeys, maxDepth, primaryPivotColumns),
        headerName: key,
        pivotKeys: newPivotKeys,
        columnGroupShow: 'open',
        openByDefault: openByDefault,
        groupId: this.generateColumnGroupId(newPivotKeys)
      });
    });
    groups.sort(comparator);
    return groups;
  }
  buildMeasureCols(pivotKeys) {
    const measureColumns = this.columnModel.getValueColumns();
    if (measureColumns.length === 0) {
      return [this.createColDef(null, '-', pivotKeys)];
    }
    return measureColumns.map(measureCol => {
      const columnName = this.columnModel.getDisplayNameForColumn(measureCol, 'header');
      return Object.assign(Object.assign({}, this.createColDef(measureCol, columnName, pivotKeys)), {
        columnGroupShow: 'open'
      });
    });
  }
  addExpandablePivotGroups(pivotColumnGroupDefs, pivotColumnDefs) {
    if (this.gridOptionsService.get('suppressExpandablePivotGroups') || this.gridOptionsService.get('pivotColumnGroupTotals')) {
      return;
    }
    const recursivelyAddSubTotals = (groupDef, currentPivotColumnDefs, acc) => {
      const group = groupDef;
      if (group.children) {
        const childAcc = new Map();
        group.children.forEach(grp => {
          recursivelyAddSubTotals(grp, currentPivotColumnDefs, childAcc);
        });
        const firstGroup = !group.children.some(child => child.children);
        this.columnModel.getValueColumns().forEach(valueColumn => {
          const columnName = this.columnModel.getDisplayNameForColumn(valueColumn, 'header');
          const totalColDef = this.createColDef(valueColumn, columnName, groupDef.pivotKeys);
          totalColDef.pivotTotalColumnIds = childAcc.get(valueColumn.getColId());
          totalColDef.columnGroupShow = 'closed';
          totalColDef.aggFunc = valueColumn.getAggFunc();
          if (!firstGroup) {
            const children = groupDef.children;
            children.push(totalColDef);
            currentPivotColumnDefs.push(totalColDef);
          }
        });
        this.merge(acc, childAcc);
      } else {
        const def = groupDef;
        if (!def.pivotValueColumn) {
          return;
        }
        const pivotValueColId = def.pivotValueColumn.getColId();
        const arr = acc.has(pivotValueColId) ? acc.get(pivotValueColId) : [];
        arr.push(def.colId);
        acc.set(pivotValueColId, arr);
      }
    };
    pivotColumnGroupDefs.forEach(groupDef => {
      recursivelyAddSubTotals(groupDef, pivotColumnDefs, new Map());
    });
  }
  addPivotTotalsToGroups(pivotColumnGroupDefs, pivotColumnDefs) {
    if (!this.gridOptionsService.get('pivotColumnGroupTotals')) {
      return;
    }
    const insertAfter = this.gridOptionsService.get('pivotColumnGroupTotals') === 'after';
    const valueCols = this.columnModel.getValueColumns();
    const aggFuncs = valueCols.map(valueCol => valueCol.getAggFunc());
    if (!aggFuncs || aggFuncs.length < 1 || !this.sameAggFuncs(aggFuncs)) {
      return;
    }
    const valueColumn = valueCols[0];
    pivotColumnGroupDefs.forEach(groupDef => {
      this.recursivelyAddPivotTotal(groupDef, pivotColumnDefs, valueColumn, insertAfter);
    });
  }
  recursivelyAddPivotTotal(groupDef, pivotColumnDefs, valueColumn, insertAfter) {
    const group = groupDef;
    if (!group.children) {
      const def = groupDef;
      return def.colId ? [def.colId] : null;
    }
    let colIds = [];
    group.children.forEach(grp => {
      const childColIds = this.recursivelyAddPivotTotal(grp, pivotColumnDefs, valueColumn, insertAfter);
      if (childColIds) {
        colIds = colIds.concat(childColIds);
      }
    });
    if (group.children.length > 1) {
      const localeTextFunc = this.localeService.getLocaleTextFunc();
      const headerName = localeTextFunc('pivotColumnGroupTotals', 'Total');
      const totalColDef = this.createColDef(valueColumn, headerName, groupDef.pivotKeys, true);
      totalColDef.pivotTotalColumnIds = colIds;
      totalColDef.aggFunc = valueColumn.getAggFunc();
      const children = groupDef.children;
      insertAfter ? children.push(totalColDef) : children.unshift(totalColDef);
      pivotColumnDefs.push(totalColDef);
    }
    return colIds;
  }
  addRowGroupTotals(pivotColumnGroupDefs, pivotColumnDefs) {
    if (!this.gridOptionsService.get('pivotRowTotals')) {
      return;
    }
    const insertAfter = this.gridOptionsService.get('pivotRowTotals') === 'after';
    const valueColumns = this.columnModel.getValueColumns();
    const valueCols = insertAfter ? valueColumns.slice() : valueColumns.slice().reverse();
    for (let i = 0; i < valueCols.length; i++) {
      const valueCol = valueCols[i];
      let colIds = [];
      pivotColumnGroupDefs.forEach(groupDef => {
        colIds = colIds.concat(this.extractColIdsForValueColumn(groupDef, valueCol));
      });
      const withGroup = valueCols.length > 1 || !this.gridOptionsService.get('removePivotHeaderRowWhenSingleValueColumn');
      this.createRowGroupTotal(pivotColumnGroupDefs, pivotColumnDefs, valueCol, colIds, insertAfter, withGroup);
    }
  }
  extractColIdsForValueColumn(groupDef, valueColumn) {
    const group = groupDef;
    if (!group.children) {
      const colDef = group;
      return colDef.pivotValueColumn === valueColumn && colDef.colId ? [colDef.colId] : [];
    }
    let colIds = [];
    group.children.forEach(grp => {
      this.extractColIdsForValueColumn(grp, valueColumn);
      const childColIds = this.extractColIdsForValueColumn(grp, valueColumn);
      colIds = colIds.concat(childColIds);
    });
    return colIds;
  }
  createRowGroupTotal(parentChildren, pivotColumnDefs, valueColumn, colIds, insertAfter, addGroup) {
    const measureColumns = this.columnModel.getValueColumns();
    let colDef;
    if (measureColumns.length === 0) {
      colDef = this.createColDef(null, '-', []);
    } else {
      const columnName = this.columnModel.getDisplayNameForColumn(valueColumn, 'header');
      colDef = this.createColDef(valueColumn, columnName, []);
      colDef.pivotTotalColumnIds = colIds;
    }
    colDef.colId = PivotColDefService_1.PIVOT_ROW_TOTAL_PREFIX + colDef.colId;
    pivotColumnDefs.push(colDef);
    const valueGroup = addGroup ? {
      children: [colDef],
      pivotKeys: [],
      groupId: `${PivotColDefService_1.PIVOT_ROW_TOTAL_PREFIX}_pivotGroup_${valueColumn.getColId()}`
    } : colDef;
    insertAfter ? parentChildren.push(valueGroup) : parentChildren.unshift(valueGroup);
  }
  createColDef(valueColumn, headerName, pivotKeys, totalColumn = false) {
    const colDef = {};
    if (valueColumn) {
      const colDefToCopy = valueColumn.getColDef();
      Object.assign(colDef, colDefToCopy);
      colDef.hide = false;
    }
    colDef.headerName = headerName;
    colDef.colId = this.generateColumnId(pivotKeys || [], valueColumn && !totalColumn ? valueColumn.getColId() : '');
    colDef.field = colDef.colId;
    colDef.valueGetter = params => {
      var _a;
      return (_a = params.data) === null || _a === void 0 ? void 0 : _a[params.colDef.field];
    };
    colDef.pivotKeys = pivotKeys;
    colDef.pivotValueColumn = valueColumn;
    if (colDef.filter === true) {
      colDef.filter = 'zingNumberColumnFilter';
    }
    return colDef;
  }
  sameAggFuncs(aggFuncs) {
    if (aggFuncs.length == 1) {
      return true;
    }
    for (let i = 1; i < aggFuncs.length; i++) {
      if (aggFuncs[i] !== aggFuncs[0]) {
        return false;
      }
    }
    return true;
  }
  headerNameComparator(userComparator, a, b) {
    if (userComparator) {
      return userComparator(a.headerName, b.headerName);
    } else {
      if (a.headerName && !b.headerName) {
        return 1;
      } else if (!a.headerName && b.headerName) {
        return -1;
      }
      if (!a.headerName || !b.headerName) {
        return 0;
      }
      if (a.headerName < b.headerName) {
        return -1;
      }
      if (a.headerName > b.headerName) {
        return 1;
      }
      return 0;
    }
  }
  merge(m1, m2) {
    m2.forEach((value, key, map) => {
      const existingList = m1.has(key) ? m1.get(key) : [];
      const updatedList = [...existingList, ...value];
      m1.set(key, updatedList);
    });
  }
  generateColumnGroupId(pivotKeys) {
    const pivotCols = this.columnModel.getPivotColumns().map(col => col.getColId());
    return `pivotGroup_${pivotCols.join('-')}_${pivotKeys.join('-')}`;
  }
  generateColumnId(pivotKeys, measureColumnId) {
    const pivotCols = this.columnModel.getPivotColumns().map(col => col.getColId());
    return `pivot_${pivotCols.join('-')}_${pivotKeys.join('-')}_${measureColumnId}`;
  }
  createColDefsFromFields(fields) {
    ;
    const uniqueValues = {};
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      const parts = field.split(this.fieldSeparator);
      let level = uniqueValues;
      for (let p = 0; p < parts.length; p++) {
        const part = parts[p];
        if (level[part] == null) {
          level[part] = {};
        }
        level = level[part];
      }
    }
    const uniqueValuesToGroups = (id, key, uniqueValues, depth) => {
      var _a;
      const children = [];
      for (let key in uniqueValues) {
        const item = uniqueValues[key];
        const child = uniqueValuesToGroups(`${id}${this.fieldSeparator}${key}`, key, item, depth + 1);
        children.push(child);
      }
      if (children.length === 0) {
        const col = {
          colId: id,
          headerName: key,
          valueGetter: params => {
            var _a;
            return (_a = params.data) === null || _a === void 0 ? void 0 : _a[id];
          }
        };
        const potentialAggCol = this.columnModel.getPrimaryColumn(key);
        if (potentialAggCol) {
          col.headerName = (_a = this.columnModel.getDisplayNameForColumn(potentialAggCol, 'header')) !== null && _a !== void 0 ? _a : key;
          col.aggFunc = potentialAggCol.getAggFunc();
          col.pivotValueColumn = potentialAggCol;
        }
        return col;
      }
      const collapseSingleChildren = this.gridOptionsService.get('removePivotHeaderRowWhenSingleValueColumn');
      if (collapseSingleChildren && children.length === 1 && 'colId' in children[0]) {
        children[0].headerName = key;
        return children[0];
      }
      const group = {
        openByDefault: this.pivotDefaultExpanded === -1 || depth < this.pivotDefaultExpanded,
        groupId: id,
        headerName: key,
        children
      };
      return group;
    };
    const res = [];
    for (let key in uniqueValues) {
      const item = uniqueValues[key];
      const col = uniqueValuesToGroups(key, key, item, 0);
      res.push(col);
    }
    return res;
  }
};
PivotColDefService.PIVOT_ROW_TOTAL_PREFIX = 'PivotRowTotal_';
__decorate([Autowired('columnModel')], PivotColDefService.prototype, "columnModel", void 0);
__decorate([Autowired('gridOptionsService')], PivotColDefService.prototype, "gos", void 0);
__decorate([PostConstruct], PivotColDefService.prototype, "init", null);
PivotColDefService = PivotColDefService_1 = __decorate([Bean('pivotColDefService')], PivotColDefService);
export { PivotColDefService };
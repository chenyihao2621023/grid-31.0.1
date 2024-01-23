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
import { ColumnKeyCreator } from "./columnKeyCreator";
import { ProvidedColumnGroup } from "../entities/providedColumnGroup";
import { Column } from "../entities/column";
import { Autowired, Bean, Qualifier } from "../context/context";
import { DefaultColumnTypes } from "../entities/defaultColumnTypes";
import { BeanStub } from "../context/beanStub";
import { iterateObject, mergeDeep } from '../utils/object';
import { attrToNumber, attrToBoolean } from '../utils/generic';
import { warnOnce } from '../utils/function';
let ColumnFactory = class ColumnFactory extends BeanStub {
  setBeans(loggerFactory) {
    this.logger = loggerFactory.create('ColumnFactory');
  }
  createColumnTree(defs, primaryColumns, existingTree) {
    const columnKeyCreator = new ColumnKeyCreator();
    const {
      existingCols,
      existingGroups,
      existingColKeys
    } = this.extractExistingTreeData(existingTree);
    columnKeyCreator.addExistingKeys(existingColKeys);
    const unbalancedTree = this.recursivelyCreateColumns(defs, 0, primaryColumns, existingCols, columnKeyCreator, existingGroups);
    const treeDept = this.findMaxDept(unbalancedTree, 0);
    this.logger.log('Number of levels for grouped columns is ' + treeDept);
    const columnTree = this.balanceColumnTree(unbalancedTree, 0, treeDept, columnKeyCreator);
    const deptFirstCallback = (child, parent) => {
      if (child instanceof ProvidedColumnGroup) {
        child.setupExpandable();
      }
      child.setOriginalParent(parent);
    };
    this.columnUtils.depthFirstOriginalTreeSearch(null, columnTree, deptFirstCallback);
    return {
      columnTree,
      treeDept
    };
  }
  extractExistingTreeData(existingTree) {
    const existingCols = [];
    const existingGroups = [];
    const existingColKeys = [];
    if (existingTree) {
      this.columnUtils.depthFirstOriginalTreeSearch(null, existingTree, item => {
        if (item instanceof ProvidedColumnGroup) {
          const group = item;
          existingGroups.push(group);
        } else {
          const col = item;
          existingColKeys.push(col.getId());
          existingCols.push(col);
        }
      });
    }
    return {
      existingCols,
      existingGroups,
      existingColKeys
    };
  }
  createForAutoGroups(autoGroupCols, gridBalancedTree) {
    return autoGroupCols.map(col => this.createAutoGroupTreeItem(gridBalancedTree, col));
  }
  createAutoGroupTreeItem(balancedColumnTree, column) {
    const dept = this.findDepth(balancedColumnTree);
    let nextChild = column;
    for (let i = dept - 1; i >= 0; i--) {
      const autoGroup = new ProvidedColumnGroup(null, `FAKE_PATH_${column.getId()}}_${i}`, true, i);
      this.createBean(autoGroup);
      autoGroup.setChildren([nextChild]);
      nextChild.setOriginalParent(autoGroup);
      nextChild = autoGroup;
    }
    if (dept === 0) {
      column.setOriginalParent(null);
    }
    return nextChild;
  }
  findDepth(balancedColumnTree) {
    let dept = 0;
    let pointer = balancedColumnTree;
    while (pointer && pointer[0] && pointer[0] instanceof ProvidedColumnGroup) {
      dept++;
      pointer = pointer[0].getChildren();
    }
    return dept;
  }
  balanceColumnTree(unbalancedTree, currentDept, columnDept, columnKeyCreator) {
    const result = [];
    for (let i = 0; i < unbalancedTree.length; i++) {
      const child = unbalancedTree[i];
      if (child instanceof ProvidedColumnGroup) {
        const originalGroup = child;
        const newChildren = this.balanceColumnTree(originalGroup.getChildren(), currentDept + 1, columnDept, columnKeyCreator);
        originalGroup.setChildren(newChildren);
        result.push(originalGroup);
      } else {
        let firstPaddedGroup;
        let currentPaddedGroup;
        for (let j = columnDept - 1; j >= currentDept; j--) {
          const newColId = columnKeyCreator.getUniqueKey(null, null);
          const colGroupDefMerged = this.createMergedColGroupDef(null);
          const paddedGroup = new ProvidedColumnGroup(colGroupDefMerged, newColId, true, currentDept);
          this.createBean(paddedGroup);
          if (currentPaddedGroup) {
            currentPaddedGroup.setChildren([paddedGroup]);
          }
          currentPaddedGroup = paddedGroup;
          if (!firstPaddedGroup) {
            firstPaddedGroup = currentPaddedGroup;
          }
        }
        if (firstPaddedGroup && currentPaddedGroup) {
          result.push(firstPaddedGroup);
          const hasGroups = unbalancedTree.some(leaf => leaf instanceof ProvidedColumnGroup);
          if (hasGroups) {
            currentPaddedGroup.setChildren([child]);
            continue;
          } else {
            currentPaddedGroup.setChildren(unbalancedTree);
            break;
          }
        }
        result.push(child);
      }
    }
    return result;
  }
  findMaxDept(treeChildren, dept) {
    let maxDeptThisLevel = dept;
    for (let i = 0; i < treeChildren.length; i++) {
      const abstractColumn = treeChildren[i];
      if (abstractColumn instanceof ProvidedColumnGroup) {
        const originalGroup = abstractColumn;
        const newDept = this.findMaxDept(originalGroup.getChildren(), dept + 1);
        if (maxDeptThisLevel < newDept) {
          maxDeptThisLevel = newDept;
        }
      }
    }
    return maxDeptThisLevel;
  }
  recursivelyCreateColumns(defs, level, primaryColumns, existingColsCopy, columnKeyCreator, existingGroups) {
    if (!defs) return [];
    const result = new Array(defs.length);
    for (let i = 0; i < result.length; i++) {
      const def = defs[i];
      if (this.isColumnGroup(def)) {
        result[i] = this.createColumnGroup(primaryColumns, def, level, existingColsCopy, columnKeyCreator, existingGroups);
      } else {
        result[i] = this.createColumn(primaryColumns, def, existingColsCopy, columnKeyCreator);
      }
    }
    return result;
  }
  createColumnGroup(primaryColumns, colGroupDef, level, existingColumns, columnKeyCreator, existingGroups) {
    const colGroupDefMerged = this.createMergedColGroupDef(colGroupDef);
    const groupId = columnKeyCreator.getUniqueKey(colGroupDefMerged.groupId || null, null);
    const providedGroup = new ProvidedColumnGroup(colGroupDefMerged, groupId, false, level);
    this.createBean(providedGroup);
    const existingGroupAndIndex = this.findExistingGroup(colGroupDef, existingGroups);
    if (existingGroupAndIndex) {
      existingGroups.splice(existingGroupAndIndex.idx, 1);
    }
    let existingGroup = existingGroupAndIndex === null || existingGroupAndIndex === void 0 ? void 0 : existingGroupAndIndex.group;
    if (existingGroup) {
      providedGroup.setExpanded(existingGroup.isExpanded());
    }
    const children = this.recursivelyCreateColumns(colGroupDefMerged.children, level + 1, primaryColumns, existingColumns, columnKeyCreator, existingGroups);
    providedGroup.setChildren(children);
    return providedGroup;
  }
  createMergedColGroupDef(colGroupDef) {
    const colGroupDefMerged = {};
    Object.assign(colGroupDefMerged, this.gridOptionsService.get('defaultColGroupDef'));
    Object.assign(colGroupDefMerged, colGroupDef);
    return colGroupDefMerged;
  }
  createColumn(primaryColumns, colDef, existingColsCopy, columnKeyCreator) {
    const existingColAndIndex = this.findExistingColumn(colDef, existingColsCopy);
    if (existingColAndIndex) {
      existingColsCopy === null || existingColsCopy === void 0 ? void 0 : existingColsCopy.splice(existingColAndIndex.idx, 1);
    }
    let column = existingColAndIndex === null || existingColAndIndex === void 0 ? void 0 : existingColAndIndex.column;
    if (!column) {
      const colId = columnKeyCreator.getUniqueKey(colDef.colId, colDef.field);
      const colDefMerged = this.addColumnDefaultAndTypes(colDef, colId);
      column = new Column(colDefMerged, colDef, colId, primaryColumns);
      this.context.createBean(column);
    } else {
      const colDefMerged = this.addColumnDefaultAndTypes(colDef, column.getColId());
      column.setColDef(colDefMerged, colDef);
      this.applyColumnState(column, colDefMerged);
    }
    this.dataTypeService.addColumnListeners(column);
    return column;
  }
  applyColumnState(column, colDef) {
    const flex = attrToNumber(colDef.flex);
    if (flex !== undefined) {
      column.setFlex(flex);
    }
    const noFlexThisCol = column.getFlex() <= 0;
    if (noFlexThisCol) {
      const width = attrToNumber(colDef.width);
      if (width != null) {
        column.setActualWidth(width);
      } else {
        const widthBeforeUpdate = column.getActualWidth();
        column.setActualWidth(widthBeforeUpdate);
      }
    }
    if (colDef.sort !== undefined) {
      if (colDef.sort == 'asc' || colDef.sort == 'desc') {
        column.setSort(colDef.sort);
      } else {
        column.setSort(undefined);
      }
    }
    const sortIndex = attrToNumber(colDef.sortIndex);
    if (sortIndex !== undefined) {
      column.setSortIndex(sortIndex);
    }
    const hide = attrToBoolean(colDef.hide);
    if (hide !== undefined) {
      column.setVisible(!hide);
    }
    if (colDef.pinned !== undefined) {
      column.setPinned(colDef.pinned);
    }
  }
  findExistingColumn(newColDef, existingColsCopy) {
    if (!existingColsCopy) return undefined;
    for (let i = 0; i < existingColsCopy.length; i++) {
      const def = existingColsCopy[i].getUserProvidedColDef();
      if (!def) continue;
      const newHasId = newColDef.colId != null;
      if (newHasId) {
        if (existingColsCopy[i].getId() === newColDef.colId) {
          return {
            idx: i,
            column: existingColsCopy[i]
          };
        }
        continue;
      }
      const newHasField = newColDef.field != null;
      if (newHasField) {
        if (def.field === newColDef.field) {
          return {
            idx: i,
            column: existingColsCopy[i]
          };
        }
        continue;
      }
      if (def === newColDef) {
        return {
          idx: i,
          column: existingColsCopy[i]
        };
      }
    }
    return undefined;
  }
  findExistingGroup(newGroupDef, existingGroups) {
    const newHasId = newGroupDef.groupId != null;
    if (!newHasId) {
      return undefined;
    }
    for (let i = 0; i < existingGroups.length; i++) {
      const existingGroup = existingGroups[i];
      const existingDef = existingGroup.getColGroupDef();
      if (!existingDef) {
        continue;
      }
      if (existingGroup.getId() === newGroupDef.groupId) {
        return {
          idx: i,
          group: existingGroup
        };
      }
    }
    return undefined;
  }
  addColumnDefaultAndTypes(colDef, colId) {
    const res = {};
    const defaultColDef = this.gridOptionsService.get('defaultColDef');
    mergeDeep(res, defaultColDef, false, true);
    const columnType = this.dataTypeService.updateColDefAndGetColumnType(res, colDef, colId);
    if (columnType) {
      this.assignColumnTypes(columnType, res);
    }
    mergeDeep(res, colDef, false, true);
    const autoGroupColDef = this.gridOptionsService.get('autoGroupColumnDef');
    const isSortingCoupled = this.gridOptionsService.isColumnsSortingCoupledToGroup();
    if (colDef.rowGroup && autoGroupColDef && isSortingCoupled) {
      mergeDeep(res, {
        sort: autoGroupColDef.sort,
        initialSort: autoGroupColDef.initialSort
      }, false, true);
    }
    this.dataTypeService.validateColDef(res);
    return res;
  }
  assignColumnTypes(typeKeys, colDefMerged) {
    if (!typeKeys.length) {
      return;
    }
    const allColumnTypes = Object.assign({}, DefaultColumnTypes);
    const userTypes = this.gridOptionsService.get('columnTypes') || {};
    iterateObject(userTypes, (key, value) => {
      if (key in allColumnTypes) {
        console.warn(`ZING Grid: the column type '${key}' is a default column type and cannot be overridden.`);
      } else {
        const colType = value;
        if (colType.type) {
          warnOnce(`Column type definitions 'columnTypes' with a 'type' attribute are not supported ` + `because a column type cannot refer to another column type. Only column definitions ` + `'columnDefs' can use the 'type' attribute to refer to a column type.`);
        }
        allColumnTypes[key] = value;
      }
    });
    typeKeys.forEach(t => {
      const typeColDef = allColumnTypes[t.trim()];
      if (typeColDef) {
        mergeDeep(colDefMerged, typeColDef, false, true);
      } else {
        console.warn("ZING Grid: colDef.type '" + t + "' does not correspond to defined gridOptions.columnTypes");
      }
    });
  }
  isColumnGroup(abstractColDef) {
    return abstractColDef.children !== undefined;
  }
};
__decorate([Autowired('columnUtils')], ColumnFactory.prototype, "columnUtils", void 0);
__decorate([Autowired('dataTypeService')], ColumnFactory.prototype, "dataTypeService", void 0);
__decorate([__param(0, Qualifier('loggerFactory'))], ColumnFactory.prototype, "setBeans", null);
ColumnFactory = __decorate([Bean('columnFactory')], ColumnFactory);
export { ColumnFactory };
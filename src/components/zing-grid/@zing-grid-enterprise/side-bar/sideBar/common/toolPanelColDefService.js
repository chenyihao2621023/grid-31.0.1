var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, Autowired, Bean, BeanStub, ProvidedColumnGroup } from "@/components/zing-grid/@zing-grid-community/core/main.js";
let ToolPanelColDefService = class ToolPanelColDefService extends BeanStub {
  constructor() {
    super(...arguments);
    this.isColGroupDef = colDef => colDef && typeof colDef.children !== 'undefined';
    this.getId = colDef => {
      return this.isColGroupDef(colDef) ? colDef.groupId : colDef.colId;
    };
  }
  createColumnTree(colDefs) {
    const invalidColIds = [];
    const createDummyColGroup = (abstractColDef, depth) => {
      if (this.isColGroupDef(abstractColDef)) {
        const groupDef = abstractColDef;
        const groupId = typeof groupDef.groupId !== 'undefined' ? groupDef.groupId : groupDef.headerName;
        const group = new ProvidedColumnGroup(groupDef, groupId, false, depth);
        const children = [];
        groupDef.children.forEach(def => {
          const child = createDummyColGroup(def, depth + 1);
          if (child) {
            children.push(child);
          }
        });
        group.setChildren(children);
        return group;
      } else {
        const colDef = abstractColDef;
        const key = colDef.colId ? colDef.colId : colDef.field;
        const column = this.columnModel.getPrimaryColumn(key);
        if (!column) {
          invalidColIds.push(colDef);
        }
        return column;
      }
    };
    const mappedResults = [];
    colDefs.forEach(colDef => {
      const result = createDummyColGroup(colDef, 0);
      if (result) {
        mappedResults.push(result);
      }
    });
    if (invalidColIds.length > 0) {
      console.warn('ZING Grid: unable to find grid columns for the supplied colDef(s):', invalidColIds);
    }
    return mappedResults;
  }
  syncLayoutWithGrid(syncLayoutCallback) {
    const leafPathTrees = this.getLeafPathTrees();
    const mergedColumnTrees = this.mergeLeafPathTrees(leafPathTrees);
    syncLayoutCallback(mergedColumnTrees);
  }
  getLeafPathTrees() {
    const getLeafPathTree = (node, childDef) => {
      let leafPathTree;
      if (node instanceof ProvidedColumnGroup) {
        if (node.isPadding()) {
          leafPathTree = childDef;
        } else {
          const groupDef = Object.assign({}, node.getColGroupDef());
          groupDef.groupId = node.getGroupId();
          groupDef.children = [childDef];
          leafPathTree = groupDef;
        }
      } else {
        const colDef = Object.assign({}, node.getColDef());
        colDef.colId = node.getColId();
        leafPathTree = colDef;
      }
      const parent = node.getOriginalParent();
      if (parent) {
        return getLeafPathTree(parent, leafPathTree);
      } else {
        return leafPathTree;
      }
    };
    const allGridColumns = this.columnModel.getAllGridColumns();
    const allPrimaryGridColumns = allGridColumns.filter(column => {
      const colDef = column.getColDef();
      return column.isPrimary() && !colDef.showRowGroup;
    });
    return allPrimaryGridColumns.map(col => getLeafPathTree(col, col.getColDef()));
  }
  mergeLeafPathTrees(leafPathTrees) {
    const matchingRootGroupIds = (pathA, pathB) => {
      const bothPathsAreGroups = this.isColGroupDef(pathA) && this.isColGroupDef(pathB);
      return bothPathsAreGroups && this.getId(pathA) === this.getId(pathB);
    };
    const mergeTrees = (treeA, treeB) => {
      if (!this.isColGroupDef(treeB)) {
        return treeA;
      }
      const mergeResult = treeA;
      const groupToMerge = treeB;
      if (groupToMerge.children && groupToMerge.groupId) {
        const added = this.addChildrenToGroup(mergeResult, groupToMerge.groupId, groupToMerge.children[0]);
        if (added) {
          return mergeResult;
        }
      }
      groupToMerge.children.forEach(child => mergeTrees(mergeResult, child));
      return mergeResult;
    };
    const mergeColDefs = [];
    for (let i = 1; i <= leafPathTrees.length; i++) {
      const first = leafPathTrees[i - 1];
      const second = leafPathTrees[i];
      if (matchingRootGroupIds(first, second)) {
        leafPathTrees[i] = mergeTrees(first, second);
      } else {
        mergeColDefs.push(first);
      }
    }
    return mergeColDefs;
  }
  addChildrenToGroup(tree, groupId, colDef) {
    const subGroupIsSplit = (currentSubGroup, currentSubGroupToAdd) => {
      const existingChildIds = currentSubGroup.children.map(this.getId);
      const childGroupAlreadyExists = _.includes(existingChildIds, this.getId(currentSubGroupToAdd));
      const lastChild = _.last(currentSubGroup.children);
      const lastChildIsDifferent = lastChild && this.getId(lastChild) !== this.getId(currentSubGroupToAdd);
      return childGroupAlreadyExists && lastChildIsDifferent;
    };
    if (!this.isColGroupDef(tree)) {
      return true;
    }
    const currentGroup = tree;
    const groupToAdd = colDef;
    if (subGroupIsSplit(currentGroup, groupToAdd)) {
      currentGroup.children.push(groupToAdd);
      return true;
    }
    if (currentGroup.groupId === groupId) {
      const existingChildIds = currentGroup.children.map(this.getId);
      const colDefAlreadyPresent = _.includes(existingChildIds, this.getId(groupToAdd));
      if (!colDefAlreadyPresent) {
        currentGroup.children.push(groupToAdd);
        return true;
      }
    }
    currentGroup.children.forEach(subGroup => this.addChildrenToGroup(subGroup, groupId, colDef));
    return false;
  }
};
__decorate([Autowired('columnModel')], ToolPanelColDefService.prototype, "columnModel", void 0);
ToolPanelColDefService = __decorate([Bean('toolPanelColDefService')], ToolPanelColDefService);
export { ToolPanelColDefService };
var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, Autowired, Bean, BeanStub, RowNode } from "@/components/zing-grid/@zing-grid-community/core/main.js";
let FlattenStage = class FlattenStage extends BeanStub {
  execute(params) {
    const rootNode = params.rowNode;
    const result = [];
    const skipLeafNodes = this.columnModel.isPivotMode();
    const showRootNode = skipLeafNodes && rootNode.leafGroup;
    const topList = showRootNode ? [rootNode] : rootNode.childrenAfterSort;
    const details = this.getFlattenDetails();
    this.recursivelyAddToRowsToDisplay(details, topList, result, skipLeafNodes, 0);
    const atLeastOneRowPresent = result.length > 0;
    const includeGroupTotalFooter = !showRootNode && atLeastOneRowPresent && details.groupIncludeTotalFooter;
    if (includeGroupTotalFooter) {
      rootNode.createFooter();
      this.addRowNodeToRowsToDisplay(details, rootNode.sibling, result, 0);
    }
    return result;
  }
  getFlattenDetails() {
    const groupRemoveSingleChildren = this.gridOptionsService.get('groupRemoveSingleChildren');
    const groupRemoveLowestSingleChildren = !groupRemoveSingleChildren && this.gridOptionsService.get('groupRemoveLowestSingleChildren');
    return {
      groupRemoveLowestSingleChildren,
      groupRemoveSingleChildren,
      isGroupMultiAutoColumn: this.gridOptionsService.isGroupMultiAutoColumn(),
      hideOpenParents: this.gridOptionsService.get('groupHideOpenParents'),
      groupIncludeTotalFooter: this.gridOptionsService.get('groupIncludeTotalFooter'),
      getGroupIncludeFooter: this.gridOptionsService.getGroupIncludeFooter()
    };
  }
  recursivelyAddToRowsToDisplay(details, rowsToFlatten, result, skipLeafNodes, uiLevel) {
    if (_.missingOrEmpty(rowsToFlatten)) {
      return;
    }
    for (let i = 0; i < rowsToFlatten.length; i++) {
      const rowNode = rowsToFlatten[i];
      const isParent = rowNode.hasChildren();
      const isSkippedLeafNode = skipLeafNodes && !isParent;
      const isRemovedSingleChildrenGroup = details.groupRemoveSingleChildren && isParent && rowNode.childrenAfterGroup.length === 1;
      const isRemovedLowestSingleChildrenGroup = details.groupRemoveLowestSingleChildren && isParent && rowNode.leafGroup && rowNode.childrenAfterGroup.length === 1;
      const neverAllowToExpand = skipLeafNodes && rowNode.leafGroup;
      const isHiddenOpenParent = details.hideOpenParents && rowNode.expanded && !rowNode.master && !neverAllowToExpand;
      const thisRowShouldBeRendered = !isSkippedLeafNode && !isHiddenOpenParent && !isRemovedSingleChildrenGroup && !isRemovedLowestSingleChildrenGroup;
      if (thisRowShouldBeRendered) {
        this.addRowNodeToRowsToDisplay(details, rowNode, result, uiLevel);
      }
      if (skipLeafNodes && rowNode.leafGroup) {
        continue;
      }
      if (isParent) {
        const excludedParent = isRemovedSingleChildrenGroup || isRemovedLowestSingleChildrenGroup;
        if (rowNode.expanded || excludedParent) {
          const uiLevelForChildren = excludedParent ? uiLevel : uiLevel + 1;
          this.recursivelyAddToRowsToDisplay(details, rowNode.childrenAfterSort, result, skipLeafNodes, uiLevelForChildren);
          const doesRowShowFooter = details.getGroupIncludeFooter({
            node: rowNode
          });
          if (doesRowShowFooter) {
            rowNode.createFooter();
            this.addRowNodeToRowsToDisplay(details, rowNode.sibling, result, uiLevelForChildren);
          } else {
            rowNode.destroyFooter();
          }
        }
      } else if (rowNode.master && rowNode.expanded) {
        const detailNode = this.createDetailNode(rowNode);
        this.addRowNodeToRowsToDisplay(details, detailNode, result, uiLevel);
      }
    }
  }
  addRowNodeToRowsToDisplay(details, rowNode, result, uiLevel) {
    result.push(rowNode);
    rowNode.setUiLevel(details.isGroupMultiAutoColumn ? 0 : uiLevel);
  }
  createDetailNode(masterNode) {
    if (_.exists(masterNode.detailNode)) {
      return masterNode.detailNode;
    }
    const detailNode = new RowNode(this.beans);
    detailNode.detail = true;
    detailNode.selectable = false;
    detailNode.parent = masterNode;
    if (_.exists(masterNode.id)) {
      detailNode.id = 'detail_' + masterNode.id;
    }
    detailNode.data = masterNode.data;
    detailNode.level = masterNode.level + 1;
    masterNode.detailNode = detailNode;
    return detailNode;
  }
};
__decorate([Autowired('columnModel')], FlattenStage.prototype, "columnModel", void 0);
__decorate([Autowired('beans')], FlattenStage.prototype, "beans", void 0);
FlattenStage = __decorate([Bean('flattenStage')], FlattenStage);
export { FlattenStage };
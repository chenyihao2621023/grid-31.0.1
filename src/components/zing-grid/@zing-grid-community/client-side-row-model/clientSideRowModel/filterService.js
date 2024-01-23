var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Bean, BeanStub } from "@/components/zing-grid/@zing-grid-community/core/main.js";
let FilterService = class FilterService extends BeanStub {
  filter(changedPath) {
    const filterActive = this.filterManager.isChildFilterPresent();
    this.filterNodes(filterActive, changedPath);
  }
  filterNodes(filterActive, changedPath) {
    const filterCallback = (rowNode, includeChildNodes) => {
      if (rowNode.hasChildren()) {
        if (filterActive && !includeChildNodes) {
          rowNode.childrenAfterFilter = rowNode.childrenAfterGroup.filter(childNode => {
            const passBecauseChildren = childNode.childrenAfterFilter && childNode.childrenAfterFilter.length > 0;
            const passBecauseDataPasses = childNode.data && this.filterManager.doesRowPassFilter({
              rowNode: childNode
            });
            return passBecauseChildren || passBecauseDataPasses;
          });
        } else {
          rowNode.childrenAfterFilter = rowNode.childrenAfterGroup;
        }
      } else {
        rowNode.childrenAfterFilter = rowNode.childrenAfterGroup;
      }
      if (rowNode.sibling) {
        rowNode.sibling.childrenAfterFilter = rowNode.childrenAfterFilter;
      }
    };
    if (this.doingTreeDataFiltering()) {
      const treeDataDepthFirstFilter = (rowNode, alreadyFoundInParent) => {
        if (rowNode.childrenAfterGroup) {
          for (let i = 0; i < rowNode.childrenAfterGroup.length; i++) {
            const childNode = rowNode.childrenAfterGroup[i];
            const foundInParent = alreadyFoundInParent || this.filterManager.doesRowPassFilter({
              rowNode: childNode
            });
            if (childNode.childrenAfterGroup) {
              treeDataDepthFirstFilter(rowNode.childrenAfterGroup[i], foundInParent);
            } else {
              filterCallback(childNode, foundInParent);
            }
          }
        }
        filterCallback(rowNode, alreadyFoundInParent);
      };
      const treeDataFilterCallback = rowNode => treeDataDepthFirstFilter(rowNode, false);
      changedPath.executeFromRootNode(treeDataFilterCallback);
    } else {
      const defaultFilterCallback = rowNode => filterCallback(rowNode, false);
      changedPath.forEachChangedNodeDepthFirst(defaultFilterCallback, true);
    }
  }
  doingTreeDataFiltering() {
    return this.gridOptionsService.get('treeData') && !this.gridOptionsService.get('excludeChildrenWhenTreeDataFiltering');
  }
};
__decorate([Autowired('filterManager')], FilterService.prototype, "filterManager", void 0);
FilterService = __decorate([Bean("filterService")], FilterService);
export { FilterService };
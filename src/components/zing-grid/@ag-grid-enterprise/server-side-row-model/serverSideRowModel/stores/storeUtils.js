var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, Autowired, Bean, BeanStub } from "@/components/zing-grid/@ag-grid-community/core/main.js";
let StoreUtils = class StoreUtils extends BeanStub {
    loadFromDatasource(p) {
        const { storeParams, parentBlock, parentNode } = p;
        const groupKeys = parentNode.getGroupKeys();
        if (!storeParams.datasource) {
            return;
        }
        const request = {
            startRow: p.startRow,
            endRow: p.endRow,
            rowGroupCols: storeParams.rowGroupCols,
            valueCols: storeParams.valueCols,
            pivotCols: storeParams.pivotCols,
            pivotMode: storeParams.pivotMode,
            groupKeys: groupKeys,
            filterModel: storeParams.filterModel,
            sortModel: storeParams.sortModel
        };
        const getRowsParams = {
            success: p.success,
            fail: p.fail,
            request: request,
            parentNode: p.parentNode,
            api: this.gridOptionsService.api,
            columnApi: this.gridOptionsService.columnApi,
            context: this.gridOptionsService.context
        };
        window.setTimeout(() => {
            if (!storeParams.datasource || !parentBlock.isAlive()) {
                // failCallback() is important, to reduce the 'RowNodeBlockLoader.activeBlockLoadsCount' count
                p.fail();
                return;
            }
            storeParams.datasource.getRows(getRowsParams);
        }, 0);
    }
    getChildStore(keys, currentCache, findNodeFunc) {
        if (_.missingOrEmpty(keys)) {
            return currentCache;
        }
        const nextKey = keys[0];
        const nextNode = findNodeFunc(nextKey);
        if (nextNode) {
            // if we have the final node, but not the final store, we create it to allow
            // early population of data
            if (keys.length === 1 && !nextNode.childStore) {
                const storeParams = this.serverSideRowModel.getParams();
                nextNode.childStore = this.createBean(this.storeFactory.createStore(storeParams, nextNode));
            }
            const keyListForNextLevel = keys.slice(1, keys.length);
            const nextStore = nextNode.childStore;
            return nextStore ? nextStore.getChildStore(keyListForNextLevel) : null;
        }
        return null;
    }
    isServerRefreshNeeded(parentRowNode, rowGroupCols, params) {
        if (params.valueColChanged || params.secondaryColChanged) {
            return true;
        }
        const level = parentRowNode.level + 1;
        const grouping = level < rowGroupCols.length;
        const leafNodes = !grouping;
        if (leafNodes) {
            return true;
        }
        const colIdThisGroup = rowGroupCols[level].id;
        const actionOnThisGroup = params.changedColumns.indexOf(colIdThisGroup) > -1;
        if (actionOnThisGroup) {
            return true;
        }
        const allCols = this.columnModel.getAllGridColumns();
        const affectedGroupCols = allCols
            // find all impacted cols which also a group display column
            .filter(col => col.getColDef().showRowGroup && params.changedColumns.includes(col.getId()))
            .map(col => col.getColDef().showRowGroup)
            // if displaying all groups, or displaying the effected col for this group, refresh
            .some(group => group === true || group === colIdThisGroup);
        return affectedGroupCols;
    }
    getServerSideInitialRowCount() {
        return this.gridOptionsService.get('serverSideInitialRowCount');
    }
    assertRowModelIsServerSide(key) {
        if (!this.gridOptionsService.isRowModelType('serverSide')) {
            _.warnOnce(`The '${key}' property can only be used with the Server Side Row Model.`);
            return false;
        }
        return true;
    }
    assertNotTreeData(key) {
        if (this.gridOptionsService.get('treeData')) {
            _.warnOnce(`The '${key}' property cannot be used while using tree data.`);
            return false;
        }
        return true;
    }
    isServerSideSortAllLevels() {
        return this.gridOptionsService.get('serverSideSortAllLevels') && this.assertRowModelIsServerSide('serverSideSortAllLevels');
    }
    isServerSideOnlyRefreshFilteredGroups() {
        return this.gridOptionsService.get('serverSideOnlyRefreshFilteredGroups') && this.assertRowModelIsServerSide('serverSideOnlyRefreshFilteredGroups');
    }
    isServerSideSortOnServer() {
        return this.gridOptionsService.get('serverSideSortOnServer') && this.assertRowModelIsServerSide('serverSideSortOnServer') && this.assertNotTreeData('serverSideSortOnServer');
    }
    isServerSideFilterOnServer() {
        return this.gridOptionsService.get('serverSideFilterOnServer') && this.assertRowModelIsServerSide('serverSideFilterOnServer') && this.assertNotTreeData('serverSideFilterOnServer');
    }
};
__decorate([
    Autowired('columnModel')
], StoreUtils.prototype, "columnModel", void 0);
__decorate([
    Autowired('rowModel')
], StoreUtils.prototype, "serverSideRowModel", void 0);
__decorate([
    Autowired('ssrmStoreFactory')
], StoreUtils.prototype, "storeFactory", void 0);
StoreUtils = __decorate([
    Bean('ssrmStoreUtils')
], StoreUtils);
export { StoreUtils };
//# sourceMappingURL=storeUtils.js.map
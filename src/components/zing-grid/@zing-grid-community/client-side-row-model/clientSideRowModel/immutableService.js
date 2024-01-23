var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Bean, BeanStub, PostConstruct, _ } from "@/components/zing-grid/@zing-grid-community/core/main.js";
let ImmutableService = class ImmutableService extends BeanStub {
  postConstruct() {
    if (this.rowModel.getType() === 'clientSide') {
      this.clientSideRowModel = this.rowModel;
      this.addManagedPropertyListener('rowData', () => this.onRowDataUpdated());
    }
  }
  isActive() {
    const getRowIdProvided = this.gridOptionsService.exists('getRowId');
    const resetRowDataOnUpdate = this.gridOptionsService.get('resetRowDataOnUpdate');
    if (resetRowDataOnUpdate) {
      return false;
    }
    return getRowIdProvided;
  }
  setRowData(rowData) {
    const transactionAndMap = this.createTransactionForRowData(rowData);
    if (!transactionAndMap) {
      return;
    }
    const [transaction, orderIdMap] = transactionAndMap;
    this.clientSideRowModel.updateRowData(transaction, orderIdMap);
  }
  createTransactionForRowData(rowData) {
    if (_.missing(this.clientSideRowModel)) {
      console.error('ZING Grid: ImmutableService only works with ClientSideRowModel');
      return;
    }
    const getRowIdFunc = this.gridOptionsService.getCallback('getRowId');
    if (getRowIdFunc == null) {
      console.error('ZING Grid: ImmutableService requires getRowId() callback to be implemented, your row data needs IDs!');
      return;
    }
    const transaction = {
      remove: [],
      update: [],
      add: []
    };
    const existingNodesMap = this.clientSideRowModel.getCopyOfNodesMap();
    const suppressSortOrder = this.gridOptionsService.get('suppressMaintainUnsortedOrder');
    const orderMap = suppressSortOrder ? undefined : {};
    if (_.exists(rowData)) {
      rowData.forEach((data, index) => {
        const id = getRowIdFunc({
          data,
          level: 0
        });
        const existingNode = existingNodesMap[id];
        if (orderMap) {
          orderMap[id] = index;
        }
        if (existingNode) {
          const dataHasChanged = existingNode.data !== data;
          if (dataHasChanged) {
            transaction.update.push(data);
          }
          existingNodesMap[id] = undefined;
        } else {
          transaction.add.push(data);
        }
      });
    }
    _.iterateObject(existingNodesMap, (id, rowNode) => {
      if (rowNode) {
        transaction.remove.push(rowNode.data);
      }
    });
    return [transaction, orderMap];
  }
  onRowDataUpdated() {
    const rowData = this.gridOptionsService.get('rowData');
    if (!rowData) {
      return;
    }
    if (this.isActive()) {
      this.setRowData(rowData);
    } else {
      this.selectionService.reset('rowDataChanged');
      this.clientSideRowModel.setRowData(rowData);
    }
  }
};
__decorate([Autowired('rowModel')], ImmutableService.prototype, "rowModel", void 0);
__decorate([Autowired('rowRenderer')], ImmutableService.prototype, "rowRenderer", void 0);
__decorate([Autowired('selectionService')], ImmutableService.prototype, "selectionService", void 0);
__decorate([PostConstruct], ImmutableService.prototype, "postConstruct", null);
ImmutableService = __decorate([Bean('immutableService')], ImmutableService);
export { ImmutableService };
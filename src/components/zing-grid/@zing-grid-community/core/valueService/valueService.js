var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Bean, PostConstruct } from "../context/context";
import { Events } from "../events";
import { BeanStub } from "../context/beanStub";
import { getValueUsingField } from "../utils/object";
import { missing, exists } from "../utils/generic";
import { warnOnce } from "../utils/function";
let ValueService = class ValueService extends BeanStub {
  constructor() {
    super(...arguments);
    this.initialised = false;
    this.isSsrm = false;
  }
  init() {
    this.isSsrm = this.gridOptionsService.isRowModelType('serverSide');
    this.cellExpressions = this.gridOptionsService.get('enableCellExpressions');
    this.isTreeData = this.gridOptionsService.get('treeData');
    this.initialised = true;
    const listener = event => this.callColumnCellValueChangedHandler(event);
    const async = this.gridOptionsService.useAsyncEvents();
    this.eventService.addEventListener(Events.EVENT_CELL_VALUE_CHANGED, listener, async);
    this.addDestroyFunc(() => this.eventService.removeEventListener(Events.EVENT_CELL_VALUE_CHANGED, listener, async));
    this.addManagedPropertyListener('treeData', propChange => this.isTreeData = propChange.currentValue);
  }
  getValue(column, rowNode, forFilter = false, ignoreAggData = false) {
    if (!this.initialised) {
      this.init();
    }
    if (!rowNode) {
      return;
    }
    const colDef = column.getColDef();
    const field = colDef.field;
    const colId = column.getColId();
    const data = rowNode.data;
    let result;
    const groupDataExists = rowNode.groupData && rowNode.groupData[colId] !== undefined;
    const aggDataExists = !ignoreAggData && rowNode.aggData && rowNode.aggData[colId] !== undefined;
    const ignoreSsrmAggData = this.isSsrm && ignoreAggData && !!column.getColDef().aggFunc;
    const ssrmFooterGroupCol = this.isSsrm && rowNode.footer && rowNode.field && (column.getColDef().showRowGroup === true || column.getColDef().showRowGroup === rowNode.field);
    if (forFilter && colDef.filterValueGetter) {
      result = this.executeFilterValueGetter(colDef.filterValueGetter, data, column, rowNode);
    } else if (this.isTreeData && aggDataExists) {
      result = rowNode.aggData[colId];
    } else if (this.isTreeData && colDef.valueGetter) {
      result = this.executeValueGetter(colDef.valueGetter, data, column, rowNode);
    } else if (this.isTreeData && field && data) {
      result = getValueUsingField(data, field, column.isFieldContainsDots());
    } else if (groupDataExists) {
      result = rowNode.groupData[colId];
    } else if (aggDataExists) {
      result = rowNode.aggData[colId];
    } else if (colDef.valueGetter) {
      result = this.executeValueGetter(colDef.valueGetter, data, column, rowNode);
    } else if (ssrmFooterGroupCol) {
      result = getValueUsingField(data, rowNode.field, column.isFieldContainsDots());
    } else if (field && data && !ignoreSsrmAggData) {
      result = getValueUsingField(data, field, column.isFieldContainsDots());
    }
    if (this.cellExpressions && typeof result === 'string' && result.indexOf('=') === 0) {
      const cellValueGetter = result.substring(1);
      result = this.executeValueGetter(cellValueGetter, data, column, rowNode);
    }
    if (result == null) {
      const openedGroup = this.getOpenedGroup(rowNode, column);
      if (openedGroup != null) {
        return openedGroup;
      }
    }
    return result;
  }
  getOpenedGroup(rowNode, column) {
    if (!this.gridOptionsService.get('showOpenedGroup')) {
      return;
    }
    const colDef = column.getColDef();
    if (!colDef.showRowGroup) {
      return;
    }
    const showRowGroup = column.getColDef().showRowGroup;
    let pointer = rowNode.parent;
    while (pointer != null) {
      if (pointer.rowGroupColumn && (showRowGroup === true || showRowGroup === pointer.rowGroupColumn.getColId())) {
        return pointer.key;
      }
      pointer = pointer.parent;
    }
    return undefined;
  }
  setValue(rowNode, colKey, newValue, eventSource) {
    const column = this.columnModel.getPrimaryColumn(colKey);
    if (!rowNode || !column) {
      return false;
    }
    if (missing(rowNode.data)) {
      rowNode.data = {};
    }
    const {
      field,
      valueSetter
    } = column.getColDef();
    if (missing(field) && missing(valueSetter)) {
      console.warn(`ZING Grid: you need either field or valueSetter set on colDef for editing to work`);
      return false;
    }
    if (!this.dataTypeService.checkType(column, newValue)) {
      console.warn(`ZING Grid: Data type of the new value does not match the cell data type of the column`);
      return false;
    }
    const params = {
      node: rowNode,
      data: rowNode.data,
      oldValue: this.getValue(column, rowNode),
      newValue: newValue,
      colDef: column.getColDef(),
      column: column,
      api: this.gridOptionsService.api,
      columnApi: this.gridOptionsService.columnApi,
      context: this.gridOptionsService.context
    };
    params.newValue = newValue;
    let valueWasDifferent;
    if (exists(valueSetter)) {
      if (typeof valueSetter === 'function') {
        valueWasDifferent = valueSetter(params);
      } else {
        valueWasDifferent = this.expressionService.evaluate(valueSetter, params);
      }
    } else {
      valueWasDifferent = this.setValueUsingField(rowNode.data, field, newValue, column.isFieldContainsDots());
    }
    if (valueWasDifferent === undefined) {
      valueWasDifferent = true;
    }
    if (!valueWasDifferent) {
      return false;
    }
    rowNode.resetQuickFilterAggregateText();
    this.valueCache.onDataChanged();
    params.newValue = this.getValue(column, rowNode);
    const event = {
      type: Events.EVENT_CELL_VALUE_CHANGED,
      event: null,
      rowIndex: rowNode.rowIndex,
      rowPinned: rowNode.rowPinned,
      column: params.column,
      api: params.api,
      columnApi: params.columnApi,
      colDef: params.colDef,
      context: params.context,
      data: rowNode.data,
      node: rowNode,
      oldValue: params.oldValue,
      newValue: params.newValue,
      value: params.newValue,
      source: eventSource
    };
    this.eventService.dispatchEvent(event);
    return true;
  }
  callColumnCellValueChangedHandler(event) {
    const onCellValueChanged = event.colDef.onCellValueChanged;
    if (typeof onCellValueChanged === 'function') {
      onCellValueChanged({
        node: event.node,
        data: event.data,
        oldValue: event.oldValue,
        newValue: event.newValue,
        colDef: event.colDef,
        column: event.column,
        api: event.api,
        columnApi: event.columnApi,
        context: event.context
      });
    }
  }
  setValueUsingField(data, field, newValue, isFieldContainsDots) {
    if (!field) {
      return false;
    }
    let valuesAreSame = false;
    if (!isFieldContainsDots) {
      valuesAreSame = data[field] === newValue;
      if (!valuesAreSame) {
        data[field] = newValue;
      }
    } else {
      const fieldPieces = field.split('.');
      let currentObject = data;
      while (fieldPieces.length > 0 && currentObject) {
        const fieldPiece = fieldPieces.shift();
        if (fieldPieces.length === 0) {
          valuesAreSame = currentObject[fieldPiece] === newValue;
          if (!valuesAreSame) {
            currentObject[fieldPiece] = newValue;
          }
        } else {
          currentObject = currentObject[fieldPiece];
        }
      }
    }
    return !valuesAreSame;
  }
  executeFilterValueGetter(valueGetter, data, column, rowNode) {
    const params = {
      data: data,
      node: rowNode,
      column: column,
      colDef: column.getColDef(),
      api: this.gridOptionsService.api,
      columnApi: this.gridOptionsService.columnApi,
      context: this.gridOptionsService.context,
      getValue: this.getValueCallback.bind(this, rowNode)
    };
    if (typeof valueGetter === 'function') {
      return valueGetter(params);
    }
    return this.expressionService.evaluate(valueGetter, params);
  }
  executeValueGetter(valueGetter, data, column, rowNode) {
    const colId = column.getColId();
    const valueFromCache = this.valueCache.getValue(rowNode, colId);
    if (valueFromCache !== undefined) {
      return valueFromCache;
    }
    const params = {
      data: data,
      node: rowNode,
      column: column,
      colDef: column.getColDef(),
      api: this.gridOptionsService.api,
      columnApi: this.gridOptionsService.columnApi,
      context: this.gridOptionsService.context,
      getValue: this.getValueCallback.bind(this, rowNode)
    };
    let result;
    if (typeof valueGetter === 'function') {
      result = valueGetter(params);
    } else {
      result = this.expressionService.evaluate(valueGetter, params);
    }
    this.valueCache.setValue(rowNode, colId, result);
    return result;
  }
  getValueCallback(node, field) {
    const otherColumn = this.columnModel.getPrimaryColumn(field);
    if (otherColumn) {
      return this.getValue(otherColumn, node);
    }
    return null;
  }
  getKeyForNode(col, rowNode) {
    const value = this.getValue(col, rowNode);
    const keyCreator = col.getColDef().keyCreator;
    let result = value;
    if (keyCreator) {
      const keyParams = {
        value: value,
        colDef: col.getColDef(),
        column: col,
        node: rowNode,
        data: rowNode.data,
        api: this.gridOptionsService.api,
        columnApi: this.gridOptionsService.columnApi,
        context: this.gridOptionsService.context
      };
      result = keyCreator(keyParams);
    }
    if (typeof result === 'string' || result == null) {
      return result;
    }
    result = String(result);
    if (result === '[object Object]') {
      warnOnce('a column you are grouping or pivoting by has objects as values. If you want to group by complex objects then either a) use a colDef.keyCreator (se ZING Grid docs) or b) to toString() on the object to return a key');
    }
    return result;
  }
};
__decorate([Autowired('expressionService')], ValueService.prototype, "expressionService", void 0);
__decorate([Autowired('columnModel')], ValueService.prototype, "columnModel", void 0);
__decorate([Autowired('valueCache')], ValueService.prototype, "valueCache", void 0);
__decorate([Autowired('dataTypeService')], ValueService.prototype, "dataTypeService", void 0);
__decorate([PostConstruct], ValueService.prototype, "init", null);
ValueService = __decorate([Bean('valueService')], ValueService);
export { ValueService };
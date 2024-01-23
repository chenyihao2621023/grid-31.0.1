var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, Autowired, BeanStub, ModuleNames, ModuleRegistry, Optional } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { ChartDataModel } from "../model/chartDataModel";
export class ChartDatasource extends BeanStub {
  getData(params) {
    if (params.crossFiltering) {
      if (params.grouping) {
        console.warn("ZING Grid: crossing filtering with row grouping is not supported.");
        return {
          chartData: [],
          columnNames: {}
        };
      }
      if (!this.gridOptionsService.isRowModelType('clientSide')) {
        console.warn("ZING Grid: crossing filtering is only supported in the client side row model.");
        return {
          chartData: [],
          columnNames: {}
        };
      }
    }
    const isServerSide = this.gridOptionsService.isRowModelType('serverSide');
    if (isServerSide && params.pivoting) {
      this.updatePivotKeysForSSRM();
    }
    const result = this.extractRowsFromGridRowModel(params);
    result.chartData = this.aggregateRowsByDimension(params, result.chartData);
    return result;
  }
  extractRowsFromGridRowModel(params) {
    let extractedRowData = [];
    const columnNames = {};
    const groupNodeIndexes = {};
    const groupsToRemove = {};
    let filteredNodes = {};
    let allRowNodes = [];
    let numRows;
    if (params.crossFiltering) {
      filteredNodes = this.getFilteredRowNodes();
      allRowNodes = this.getAllRowNodes();
      numRows = allRowNodes.length;
    } else {
      const modelLastRow = this.gridRowModel.getRowCount() - 1;
      const rangeLastRow = params.endRow >= 0 ? Math.min(params.endRow, modelLastRow) : modelLastRow;
      numRows = rangeLastRow - params.startRow + 1;
    }
    for (let i = 0; i < numRows; i++) {
      const data = {};
      const rowNode = params.crossFiltering ? allRowNodes[i] : this.gridRowModel.getRow(i + params.startRow);
      params.dimensionCols.forEach(col => {
        const colId = col.colId;
        const column = this.columnModel.getGridColumn(colId);
        if (column) {
          const valueObject = this.valueService.getValue(column, rowNode);
          if (params.grouping) {
            const valueString = valueObject && valueObject.toString ? String(valueObject.toString()) : '';
            const labels = ChartDatasource.getGroupLabels(rowNode, valueString);
            data[colId] = {
              labels,
              toString: function () {
                return this.labels.filter(l => !!l).reverse().join(' - ');
              }
            };
            if (rowNode.group) {
              groupNodeIndexes[labels.toString()] = i;
            }
            const groupKey = labels.slice(1, labels.length).toString();
            if (groupKey) {
              groupsToRemove[groupKey] = groupNodeIndexes[groupKey];
            }
          } else {
            data[colId] = valueObject;
          }
        } else {
          data[ChartDataModel.DEFAULT_CATEGORY] = i + 1;
        }
      });
      params.valueCols.forEach(col => {
        let columnNamesArr = [];
        const pivotKeys = col.getColDef().pivotKeys;
        if (pivotKeys) {
          columnNamesArr = pivotKeys.slice();
        }
        const headerName = col.getColDef().headerName;
        if (headerName) {
          columnNamesArr.push(headerName);
        }
        if (columnNamesArr.length > 0) {
          columnNames[col.getId()] = columnNamesArr;
        }
        const colId = col.getColId();
        if (params.crossFiltering) {
          const filteredOutColId = colId + '-filtered-out';
          const value = this.valueService.getValue(col, rowNode);
          const actualValue = value != null && typeof value.toNumber === 'function' ? value.toNumber() : value;
          if (filteredNodes[rowNode.id]) {
            data[colId] = actualValue;
            data[filteredOutColId] = params.aggFunc || params.isScatter ? undefined : 0;
          } else {
            data[colId] = params.aggFunc || params.isScatter ? undefined : 0;
            data[filteredOutColId] = actualValue;
          }
        } else {
          let value = this.valueService.getValue(col, rowNode);
          if (value && value.hasOwnProperty('toString')) {
            value = parseFloat(value.toString());
          }
          data[colId] = value != null && typeof value.toNumber === 'function' ? value.toNumber() : value;
        }
      });
      if (rowNode.footer) {
        data.footer = true;
      }
      extractedRowData.push(data);
    }
    if (params.grouping) {
      const groupIndexesToRemove = _.values(groupsToRemove);
      const filterFunc = (data, index) => !data.footer && !_.includes(groupIndexesToRemove, index);
      extractedRowData = extractedRowData.filter(filterFunc);
    }
    return {
      chartData: extractedRowData,
      columnNames
    };
  }
  aggregateRowsByDimension(params, dataFromGrid) {
    const dimensionCols = params.dimensionCols;
    if (!params.aggFunc || dimensionCols.length === 0) {
      return dataFromGrid;
    }
    const lastCol = _.last(dimensionCols);
    const lastColId = lastCol && lastCol.colId;
    const map = {};
    const dataAggregated = [];
    dataFromGrid.forEach(data => {
      let currentMap = map;
      dimensionCols.forEach(col => {
        const colId = col.colId;
        const key = data[colId];
        if (colId === lastColId) {
          let groupItem = currentMap[key];
          if (!groupItem) {
            groupItem = {
              __children: []
            };
            dimensionCols.forEach(dimCol => {
              const dimColId = dimCol.colId;
              groupItem[dimColId] = data[dimColId];
            });
            currentMap[key] = groupItem;
            dataAggregated.push(groupItem);
          }
          groupItem.__children.push(data);
        } else {
          if (!currentMap[key]) {
            currentMap[key] = {};
          }
          currentMap = currentMap[key];
        }
      });
    });
    if (ModuleRegistry.__assertRegistered(ModuleNames.RowGroupingModule, 'Charting Aggregation', this.context.getGridId())) {
      dataAggregated.forEach(groupItem => params.valueCols.forEach(col => {
        if (params.crossFiltering) {
          params.valueCols.forEach(valueCol => {
            const colId = valueCol.getColId();
            const dataToAgg = groupItem.__children.filter(child => typeof child[colId] !== 'undefined').map(child => child[colId]);
            let aggResult = this.aggregationStage.aggregateValues(dataToAgg, params.aggFunc);
            groupItem[valueCol.getId()] = aggResult && typeof aggResult.value !== 'undefined' ? aggResult.value : aggResult;
            const filteredOutColId = `${colId}-filtered-out`;
            const dataToAggFiltered = groupItem.__children.filter(child => typeof child[filteredOutColId] !== 'undefined').map(child => child[filteredOutColId]);
            let aggResultFiltered = this.aggregationStage.aggregateValues(dataToAggFiltered, params.aggFunc);
            groupItem[filteredOutColId] = aggResultFiltered && typeof aggResultFiltered.value !== 'undefined' ? aggResultFiltered.value : aggResultFiltered;
          });
        } else {
          const dataToAgg = groupItem.__children.map(child => child[col.getId()]);
          let aggResult = 0;
          if (ModuleRegistry.__assertRegistered(ModuleNames.RowGroupingModule, 'Charting Aggregation', this.context.getGridId())) {
            aggResult = this.aggregationStage.aggregateValues(dataToAgg, params.aggFunc);
          }
          groupItem[col.getId()] = aggResult && typeof aggResult.value !== 'undefined' ? aggResult.value : aggResult;
        }
      }));
    }
    return dataAggregated;
  }
  updatePivotKeysForSSRM() {
    const secondaryColumns = this.columnModel.getSecondaryColumns();
    if (!secondaryColumns) {
      return;
    }
    const pivotKeySeparator = this.extractPivotKeySeparator(secondaryColumns);
    secondaryColumns.forEach(col => {
      if (pivotKeySeparator === '') {
        col.getColDef().pivotKeys = [];
      } else {
        const keys = col.getColId().split(pivotKeySeparator);
        col.getColDef().pivotKeys = keys.slice(0, keys.length - 1);
      }
    });
  }
  extractPivotKeySeparator(secondaryColumns) {
    if (secondaryColumns.length === 0) {
      return '';
    }
    const extractSeparator = (columnGroup, childId) => {
      const groupId = columnGroup.getGroupId();
      if (!columnGroup.getParent()) {
        return childId.split(groupId)[1][0];
      }
      return extractSeparator(columnGroup.getParent(), groupId);
    };
    const firstSecondaryCol = secondaryColumns[0];
    if (firstSecondaryCol.getParent() == null) {
      return '';
    }
    return extractSeparator(firstSecondaryCol.getParent(), firstSecondaryCol.getColId());
  }
  static getGroupLabels(rowNode, initialLabel) {
    const labels = [initialLabel];
    while (rowNode && rowNode.level !== 0) {
      rowNode = rowNode.parent;
      if (rowNode) {
        labels.push(rowNode.key);
      }
    }
    return labels;
  }
  getFilteredRowNodes() {
    const filteredNodes = {};
    this.gridRowModel.forEachNodeAfterFilterAndSort(rowNode => {
      filteredNodes[rowNode.id] = rowNode;
    });
    return filteredNodes;
  }
  getAllRowNodes() {
    let allRowNodes = [];
    this.gridRowModel.forEachNode(rowNode => {
      allRowNodes.push(rowNode);
    });
    return this.sortRowNodes(allRowNodes);
  }
  sortRowNodes(rowNodes) {
    const sortOptions = this.sortController.getSortOptions();
    const noSort = !sortOptions || sortOptions.length == 0;
    if (noSort) return rowNodes;
    return this.rowNodeSorter.doFullSort(rowNodes, sortOptions);
  }
}
__decorate([Autowired('rowModel')], ChartDatasource.prototype, "gridRowModel", void 0);
__decorate([Autowired('valueService')], ChartDatasource.prototype, "valueService", void 0);
__decorate([Autowired('columnModel')], ChartDatasource.prototype, "columnModel", void 0);
__decorate([Autowired('rowNodeSorter')], ChartDatasource.prototype, "rowNodeSorter", void 0);
__decorate([Autowired('sortController')], ChartDatasource.prototype, "sortController", void 0);
__decorate([Optional('aggregationStage')], ChartDatasource.prototype, "aggregationStage", void 0);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Bean, BeanStub, PostConstruct, _, } from '@/components/zing-grid/@zing-grid-community/core/main.js';
import { ADVANCED_FILTER_LOCALE_TEXT } from './advancedFilterLocaleText';
import { ColFilterExpressionParser } from './colFilterExpressionParser';
import { BooleanFilterExpressionOperators, ScalarFilterExpressionOperators, TextFilterExpressionOperators, } from './filterExpressionOperators';
let AdvancedFilterExpressionService = class AdvancedFilterExpressionService extends BeanStub {
    constructor() {
        super(...arguments);
        this.columnNameToIdMap = {};
        this.columnAutocompleteEntries = null;
        this.expressionEvaluatorParams = {};
    }
    postConstruct() {
        this.expressionJoinOperators = this.generateExpressionJoinOperators();
        this.expressionOperators = this.generateExpressionOperators();
    }
    parseJoinOperator(model) {
        var _a;
        const { type } = model;
        return (_a = this.expressionJoinOperators[type]) !== null && _a !== void 0 ? _a : type;
    }
    getColumnDisplayValue(model) {
        const { colId } = model;
        const columnEntries = this.getColumnAutocompleteEntries();
        const columnEntry = columnEntries.find(({ key }) => key === colId);
        let columnName;
        if (columnEntry) {
            columnName = columnEntry.displayValue;
            this.columnNameToIdMap[columnName.toLocaleUpperCase()] = { colId, columnName };
        }
        else {
            columnName = colId;
        }
        return columnName;
    }
    getOperatorDisplayValue(model) {
        var _a, _b;
        return (_b = (_a = this.getExpressionOperator(model.filterType, model.type)) === null || _a === void 0 ? void 0 : _a.displayValue) !== null && _b !== void 0 ? _b : model.type;
    }
    getOperandModelValue(operand, baseCellDataType, column) {
        var _a;
        switch (baseCellDataType) {
            case 'number':
                return _.exists(operand) ? Number(operand) : null;
            case 'date':
                return _.serialiseDate(this.valueParserService.parseValue(column, null, operand, undefined), false);
            case 'dateString':
                // displayed string format may be different from data string format, so parse before converting to date
                const parsedDateString = this.valueParserService.parseValue(column, null, operand, undefined);
                return _.serialiseDate((_a = this.dataTypeService.getDateParserFunction()(parsedDateString)) !== null && _a !== void 0 ? _a : null, false);
        }
        return operand;
    }
    getOperandDisplayValue(model, skipFormatting) {
        var _a, _b;
        const { colId, filter } = model;
        const column = this.columnModel.getPrimaryColumn(colId);
        let operand = '';
        if (filter != null) {
            let operand1;
            switch (model.filterType) {
                case 'number':
                    operand1 = (_a = _.toStringOrNull(filter)) !== null && _a !== void 0 ? _a : '';
                    break;
                case 'date':
                    const dateValue = _.parseDateTimeFromString(filter);
                    operand1 = column ? this.valueFormatterService.formatValue(column, null, dateValue) : null;
                    break;
                case 'dateString':
                    // need to convert from ISO date string to Date to data string format to formatted string format
                    const dateStringDateValue = _.parseDateTimeFromString(filter);
                    const dateStringStringValue = column
                        ? this.dataTypeService.getDateFormatterFunction()(dateStringDateValue !== null && dateStringDateValue !== void 0 ? dateStringDateValue : undefined)
                        : null;
                    operand1 = column ? this.valueFormatterService.formatValue(column, null, dateStringStringValue) : null;
                    break;
            }
            if (model.filterType !== 'number') {
                operand1 = (_b = operand1 !== null && operand1 !== void 0 ? operand1 : _.toStringOrNull(filter)) !== null && _b !== void 0 ? _b : '';
                if (!skipFormatting) {
                    operand1 = `"${operand1}"`;
                }
            }
            operand = skipFormatting ? operand1 : ` ${operand1}`;
        }
        return operand;
    }
    parseColumnFilterModel(model) {
        var _a, _b;
        const columnName = (_a = this.getColumnDisplayValue(model)) !== null && _a !== void 0 ? _a : '';
        const operator = (_b = this.getOperatorDisplayValue(model)) !== null && _b !== void 0 ? _b : '';
        const operands = this.getOperandDisplayValue(model);
        return `[${columnName}] ${operator}${operands}`;
    }
    updateAutocompleteCache(updateEntry, type) {
        if (type === 'column') {
            const { key: colId, displayValue } = updateEntry;
            this.columnNameToIdMap[updateEntry.displayValue.toLocaleUpperCase()] = { colId, columnName: displayValue };
        }
    }
    translate(key, variableValues) {
        let defaultValue = ADVANCED_FILTER_LOCALE_TEXT[key];
        if (typeof defaultValue === 'function') {
            defaultValue = defaultValue(variableValues);
        }
        return this.localeService.getLocaleTextFunc()(key, defaultValue, variableValues);
    }
    generateAutocompleteListParams(entries, type, searchString) {
        return {
            enabled: true,
            type,
            searchString,
            entries
        };
    }
    getColumnAutocompleteEntries() {
        var _a;
        if (this.columnAutocompleteEntries) {
            return this.columnAutocompleteEntries;
        }
        const columns = (_a = this.columnModel.getAllPrimaryColumns()) !== null && _a !== void 0 ? _a : [];
        const entries = [];
        const includeHiddenColumns = this.gridOptionsService.get('includeHiddenColumnsInAdvancedFilter');
        columns.forEach(column => {
            if (column.getColDef().filter && (includeHiddenColumns || column.isVisible() || column.isRowGroupActive())) {
                entries.push({
                    key: column.getColId(),
                    displayValue: this.columnModel.getDisplayNameForColumn(column, 'advancedFilter')
                });
            }
        });
        entries.sort((a, b) => {
            var _a, _b;
            const aValue = (_a = a.displayValue) !== null && _a !== void 0 ? _a : '';
            const bValue = (_b = b.displayValue) !== null && _b !== void 0 ? _b : '';
            if (aValue < bValue) {
                return -1;
            }
            else if (bValue > aValue) {
                return 1;
            }
            return 0;
        });
        return entries;
    }
    getOperatorAutocompleteEntries(column, baseCellDataType) {
        const activeOperators = this.getActiveOperators(column);
        return this.getDataTypeExpressionOperator(baseCellDataType).getEntries(activeOperators);
    }
    getJoinOperatorAutocompleteEntries() {
        return Object.entries(this.expressionJoinOperators).map(([key, displayValue]) => ({ key, displayValue }));
    }
    getDefaultAutocompleteListParams(searchString) {
        return this.generateAutocompleteListParams(this.getColumnAutocompleteEntries(), 'column', searchString);
    }
    getDataTypeExpressionOperator(baseCellDataType) {
        return this.expressionOperators[baseCellDataType];
    }
    getExpressionOperator(baseCellDataType, operator) {
        var _a, _b;
        return (_b = (_a = this.getDataTypeExpressionOperator(baseCellDataType)) === null || _a === void 0 ? void 0 : _a.operators) === null || _b === void 0 ? void 0 : _b[operator];
    }
    getExpressionJoinOperators() {
        return this.expressionJoinOperators;
    }
    getColId(columnName) {
        const upperCaseColumnName = columnName.toLocaleUpperCase();
        const cachedColId = this.columnNameToIdMap[upperCaseColumnName];
        if (cachedColId) {
            return cachedColId;
        }
        const columnAutocompleteEntries = this.getColumnAutocompleteEntries();
        const colEntry = columnAutocompleteEntries.find(({ displayValue }) => displayValue.toLocaleUpperCase() === upperCaseColumnName);
        if (colEntry) {
            const { key: colId, displayValue } = colEntry;
            const colValue = { colId, columnName: displayValue };
            // cache for faster lookup
            this.columnNameToIdMap[upperCaseColumnName] = colValue;
            return colValue;
        }
        return null;
    }
    getExpressionEvaluatorParams(colId) {
        let params = this.expressionEvaluatorParams[colId];
        if (params) {
            return params;
        }
        const column = this.columnModel.getPrimaryColumn(colId);
        if (!column) {
            return { valueConverter: (v) => v };
        }
        const baseCellDataType = this.dataTypeService.getBaseDataType(column);
        switch (baseCellDataType) {
            case 'dateString':
                params = {
                    valueConverter: this.dataTypeService.getDateParserFunction()
                };
                break;
            case 'object':
                // If there's a filter value getter, assume the value is already a string. Otherwise we need to format it.
                if (column.getColDef().filterValueGetter) {
                    params = { valueConverter: (v) => v };
                }
                else {
                    params = {
                        valueConverter: (value, node) => {
                            var _a;
                            return (_a = this.valueFormatterService.formatValue(column, node, value)) !== null && _a !== void 0 ? _a : (typeof value.toString === 'function' ? value.toString() : '');
                        }
                    };
                }
                break;
            case 'text':
            case undefined:
                params = { valueConverter: (v) => _.toStringOrNull(v) };
                break;
            default:
                params = { valueConverter: (v) => v };
                break;
        }
        const { filterParams } = column.getColDef();
        if (filterParams) {
            [
                'caseSensitive', 'includeBlanksInEquals', 'includeBlanksInLessThan', 'includeBlanksInGreaterThan'
            ].forEach((param) => {
                const paramValue = filterParams[param];
                if (paramValue) {
                    params[param] = paramValue;
                }
            });
        }
        this.expressionEvaluatorParams[colId] = params;
        return params;
    }
    getColumnDetails(colId) {
        var _a, _b;
        const column = (_a = this.columnModel.getPrimaryColumn(colId)) !== null && _a !== void 0 ? _a : undefined;
        const baseCellDataType = (_b = (column ? this.dataTypeService.getBaseDataType(column) : undefined)) !== null && _b !== void 0 ? _b : 'text';
        return { column, baseCellDataType };
    }
    generateExpressionOperators() {
        const translate = (key, variableValues) => this.translate(key, variableValues);
        return {
            text: new TextFilterExpressionOperators({ translate }),
            boolean: new BooleanFilterExpressionOperators({ translate }),
            object: new TextFilterExpressionOperators({ translate }),
            number: new ScalarFilterExpressionOperators({ translate, equals: (v, o) => v === o }),
            date: new ScalarFilterExpressionOperators({ translate, equals: (v, o) => v.getTime() === o.getTime() }),
            dateString: new ScalarFilterExpressionOperators({ translate, equals: (v, o) => v.getTime() === o.getTime() })
        };
    }
    getColumnValue({ displayValue }) {
        return `${ColFilterExpressionParser.COL_START_CHAR}${displayValue}${ColFilterExpressionParser.COL_END_CHAR}`;
    }
    generateExpressionJoinOperators() {
        return {
            AND: this.translate('advancedFilterAnd'),
            OR: this.translate('advancedFilterOr')
        };
    }
    getActiveOperators(column) {
        var _a;
        const filterOptions = (_a = column.getColDef().filterParams) === null || _a === void 0 ? void 0 : _a.filterOptions;
        if (!filterOptions) {
            return undefined;
        }
        const isValid = filterOptions.every((filterOption) => typeof filterOption === 'string');
        return isValid ? filterOptions : undefined;
    }
    resetColumnCaches() {
        this.columnAutocompleteEntries = null;
        this.columnNameToIdMap = {};
        this.expressionEvaluatorParams = {};
    }
};
__decorate([
    Autowired('valueFormatterService')
], AdvancedFilterExpressionService.prototype, "valueFormatterService", void 0);
__decorate([
    Autowired('valueParserService')
], AdvancedFilterExpressionService.prototype, "valueParserService", void 0);
__decorate([
    Autowired('columnModel')
], AdvancedFilterExpressionService.prototype, "columnModel", void 0);
__decorate([
    Autowired('dataTypeService')
], AdvancedFilterExpressionService.prototype, "dataTypeService", void 0);
__decorate([
    PostConstruct
], AdvancedFilterExpressionService.prototype, "postConstruct", null);
AdvancedFilterExpressionService = __decorate([
    Bean('advancedFilterExpressionService')
], AdvancedFilterExpressionService);
export { AdvancedFilterExpressionService };
//# sourceMappingURL=advancedFilterExpressionService.js.map
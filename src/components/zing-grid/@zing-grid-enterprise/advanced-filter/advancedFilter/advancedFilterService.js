var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Bean, BeanStub, Events, PostConstruct, _ } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { FilterExpressionParser } from "./filterExpressionParser";
import { AdvancedFilterCtrl } from "./advancedFilterCtrl";
let AdvancedFilterService = class AdvancedFilterService extends BeanStub {
    constructor() {
        super(...arguments);
        this.appliedExpression = null;
        
        this.expression = null;
        this.isValid = true;
    }
    postConstruct() {
        this.setEnabled(this.gridOptionsService.get('enableAdvancedFilter'), true);
        this.ctrl = this.createManagedBean(new AdvancedFilterCtrl(this.enabled));
        this.expressionProxy = {
            getValue: (colId, node) => {
                const column = this.columnModel.getPrimaryColumn(colId);
                return column ? this.valueService.getValue(column, node, true) : undefined;
            },
        };
        this.addManagedPropertyListener('enableAdvancedFilter', (event) => this.setEnabled(!!event.currentValue));
        this.addManagedListener(this.eventService, Events.EVENT_NEW_COLUMNS_LOADED, (event) => this.onNewColumnsLoaded(event));
        this.addManagedPropertyListener('includeHiddenColumnsInAdvancedFilter', () => this.updateValidity());
    }
    isEnabled() {
        return this.enabled;
    }
    isFilterPresent() {
        return !!this.expressionFunction;
    }
    doesFilterPass(node) {
        return this.expressionFunction(this.expressionProxy, node, this.expressionParams);
    }
    getModel() {
        var _a;
        const expressionParser = this.createExpressionParser(this.appliedExpression);
        expressionParser === null || expressionParser === void 0 ? void 0 : expressionParser.parseExpression();
        return (_a = expressionParser === null || expressionParser === void 0 ? void 0 : expressionParser.getModel()) !== null && _a !== void 0 ? _a : null;
    }
    setModel(model) {
        const parseModel = (model, isFirstParent) => {
            if (model.filterType === 'join') {
                const operator = this.advancedFilterExpressionService.parseJoinOperator(model);
                const expression = model.conditions.map(condition => parseModel(condition))
                    .filter(condition => _.exists(condition))
                    .join(` ${operator} `);
                return isFirstParent || model.conditions.length <= 1 ? expression : `(${expression})`;
            }
            else {
                return this.advancedFilterExpressionService.parseColumnFilterModel(model);
            }
        };
        const expression = model ? parseModel(model, true) : null;
        this.setExpressionDisplayValue(expression);
        this.applyExpression();
        this.ctrl.refreshComp();
        this.ctrl.refreshBuilderComp();
    }
    getExpressionDisplayValue() {
        return this.expression;
    }
    setExpressionDisplayValue(expression) {
        this.expression = expression;
    }
    isCurrentExpressionApplied() {
        return this.appliedExpression === this.expression;
    }
    createExpressionParser(expression) {
        if (!expression) {
            return null;
        }
        return new FilterExpressionParser({
            expression,
            columnModel: this.columnModel,
            dataTypeService: this.dataTypeService,
            valueParserService: this.valueParserService,
            advancedFilterExpressionService: this.advancedFilterExpressionService,
        });
    }
    getDefaultExpression(updateEntry) {
        const updatedValue = this.advancedFilterExpressionService.getColumnValue(updateEntry) + ' ';
        return {
            updatedValue,
            updatedPosition: updatedValue.length
        };
    }
    isHeaderActive() {
        return !this.gridOptionsService.get('advancedFilterParent');
    }
    getCtrl() {
        return this.ctrl;
    }
    setEnabled(enabled, silent) {
        const previousValue = this.enabled;
        const rowModelType = this.rowModel.getType();
        const isValidRowModel = rowModelType === 'clientSide' || rowModelType === 'serverSide';
        if (enabled && !rowModelType) {
            _.warnOnce('Advanced Filter is only supported with the Client-Side Row Model or Server-Side Row Model.');
        }
        this.enabled = enabled && isValidRowModel;
        if (!silent && this.enabled !== previousValue) {
            const event = {
                type: Events.EVENT_ADVANCED_FILTER_ENABLED_CHANGED,
                enabled: this.enabled
            };
            this.eventService.dispatchEvent(event);
        }
    }
    applyExpression() {
        const expressionParser = this.createExpressionParser(this.expression);
        expressionParser === null || expressionParser === void 0 ? void 0 : expressionParser.parseExpression();
        this.applyExpressionFromParser(expressionParser);
    }
    applyExpressionFromParser(expressionParser) {
        this.isValid = !expressionParser || expressionParser.isValid();
        if (!expressionParser || !this.isValid) {
            this.expressionFunction = null;
            this.expressionParams = null;
            this.appliedExpression = null;
            return;
        }
        const { functionBody, params } = expressionParser.getFunction();
        this.expressionFunction = new Function('expressionProxy', 'node', 'params', functionBody);
        this.expressionParams = params;
        this.appliedExpression = this.expression;
    }
    updateValidity() {
        this.advancedFilterExpressionService.resetColumnCaches();
        const expressionParser = this.createExpressionParser(this.expression);
        expressionParser === null || expressionParser === void 0 ? void 0 : expressionParser.parseExpression();
        const isValid = !expressionParser || expressionParser.isValid();
        const updatedValidity = isValid !== this.isValid;
        this.applyExpressionFromParser(expressionParser);
        this.ctrl.refreshComp();
        this.ctrl.refreshBuilderComp();
        return updatedValidity;
    }
    onNewColumnsLoaded(event) {
        if (event.source !== 'gridInitializing' || !this.dataTypeService.isPendingInference()) {
            return;
        }
        this.ctrl.setInputDisabled(true);
        const destroyFunc = this.addManagedListener(this.eventService, Events.EVENT_DATA_TYPES_INFERRED, () => {
            destroyFunc === null || destroyFunc === void 0 ? void 0 : destroyFunc();
            this.ctrl.setInputDisabled(false);
        });
    }
};
__decorate([
    Autowired('valueService')
], AdvancedFilterService.prototype, "valueService", void 0);
__decorate([
    Autowired('columnModel')
], AdvancedFilterService.prototype, "columnModel", void 0);
__decorate([
    Autowired('dataTypeService')
], AdvancedFilterService.prototype, "dataTypeService", void 0);
__decorate([
    Autowired('valueParserService')
], AdvancedFilterService.prototype, "valueParserService", void 0);
__decorate([
    Autowired('rowModel')
], AdvancedFilterService.prototype, "rowModel", void 0);
__decorate([
    Autowired('advancedFilterExpressionService')
], AdvancedFilterService.prototype, "advancedFilterExpressionService", void 0);
__decorate([
    PostConstruct
], AdvancedFilterService.prototype, "postConstruct", null);
AdvancedFilterService = __decorate([
    Bean('advancedFilterService')
], AdvancedFilterService);
export { AdvancedFilterService };

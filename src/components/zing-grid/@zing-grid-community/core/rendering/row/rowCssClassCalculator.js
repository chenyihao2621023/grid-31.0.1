var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { exists } from "../../utils/generic";
import { pushAll } from "../../utils/array";
import { Autowired, Bean } from "../../context/context";
let RowCssClassCalculator = class RowCssClassCalculator {
    getInitialRowClasses(params) {
        const classes = [];
        if (exists(params.extraCssClass)) {
            classes.push(params.extraCssClass);
        }
        classes.push('zing-row');
        classes.push(params.rowFocused ? 'zing-row-focus' : 'zing-row-no-focus');
        if (params.fadeRowIn) {
            classes.push('zing-opacity-zero');
        }
        classes.push(params.rowIsEven ? 'zing-row-even' : 'zing-row-odd');
        if (params.rowNode.isRowPinned()) {
            classes.push('zing-row-pinned');
        }
        if (params.rowNode.isSelected()) {
            classes.push('zing-row-selected');
        }
        if (params.rowNode.footer) {
            classes.push('zing-row-footer');
        }
        classes.push('zing-row-level-' + params.rowLevel);
        if (params.rowNode.stub) {
            classes.push('zing-row-loading');
        }
        if (params.fullWidthRow) {
            classes.push('zing-full-width-row');
        }
        if (params.expandable) {
            classes.push('zing-row-group');
            classes.push(params.rowNode.expanded ? 'zing-row-group-expanded' : 'zing-row-group-contracted');
        }
        if (params.rowNode.dragging) {
            classes.push('zing-row-dragging');
        }
        pushAll(classes, this.processClassesFromGridOptions(params.rowNode));
        pushAll(classes, this.preProcessRowClassRules(params.rowNode));
        // we use absolute position unless we are doing print layout
        classes.push(params.printLayout ? 'zing-row-position-relative' : 'zing-row-position-absolute');
        if (params.firstRowOnPage) {
            classes.push('zing-row-first');
        }
        if (params.lastRowOnPage) {
            classes.push('zing-row-last');
        }
        if (params.fullWidthRow) {
            if (params.pinned === 'left') {
                classes.push('zing-cell-last-left-pinned');
            }
            if (params.pinned === 'right') {
                classes.push('zing-cell-first-right-pinned');
            }
        }
        return classes;
    }
    processClassesFromGridOptions(rowNode) {
        const res = [];
        const process = (rowCls) => {
            if (typeof rowCls === 'string') {
                res.push(rowCls);
            }
            else if (Array.isArray(rowCls)) {
                rowCls.forEach(e => res.push(e));
            }
        };
        // part 1 - rowClass
        const rowClass = this.gridOptionsService.get('rowClass');
        if (rowClass) {
            if (typeof rowClass === 'function') {
                console.warn('ZING Grid: rowClass should not be a function, please use getRowClass instead');
                return [];
            }
            process(rowClass);
        }
        // part 2 - rowClassFunc
        const rowClassFunc = this.gridOptionsService.getCallback('getRowClass');
        if (rowClassFunc) {
            const params = {
                data: rowNode.data,
                node: rowNode,
                rowIndex: rowNode.rowIndex
            };
            const rowClassFuncResult = rowClassFunc(params);
            process(rowClassFuncResult);
        }
        return res;
    }
    preProcessRowClassRules(rowNode) {
        const res = [];
        this.processRowClassRules(rowNode, (className) => {
            res.push(className);
        }, (className) => {
            // not catered for, if creating, no need
            // to remove class as it was never there
        });
        return res;
    }
    processRowClassRules(rowNode, onApplicableClass, onNotApplicableClass) {
        const rowClassParams = {
            data: rowNode.data,
            node: rowNode,
            rowIndex: rowNode.rowIndex,
            api: this.gridOptionsService.api,
            columnApi: this.gridOptionsService.columnApi,
            context: this.gridOptionsService.context
        };
        this.stylingService.processClassRules(undefined, this.gridOptionsService.get('rowClassRules'), rowClassParams, onApplicableClass, onNotApplicableClass);
    }
    calculateRowLevel(rowNode) {
        if (rowNode.group) {
            return rowNode.level;
        }
        // if a leaf, and a parent exists, put a level of the parent, else put level of 0 for top level item
        return rowNode.parent ? (rowNode.parent.level + 1) : 0;
    }
};
__decorate([
    Autowired('stylingService')
], RowCssClassCalculator.prototype, "stylingService", void 0);
__decorate([
    Autowired('gridOptionsService')
], RowCssClassCalculator.prototype, "gridOptionsService", void 0);
RowCssClassCalculator = __decorate([
    Bean('rowCssClassCalculator')
], RowCssClassCalculator);
export { RowCssClassCalculator };

import { CategoryAxis } from '../axis/categoryAxis';
import { GroupedCategoryAxis } from '../axis/groupedCategoryAxis';
import { LogAxis } from '../axis/logAxis';
import { NumberAxis } from '../axis/numberAxis';
import { TimeAxis } from '../axis/timeAxis';
const AXIS_CONSTRUCTORS = {
    [NumberAxis.type]: NumberAxis,
    [CategoryAxis.type]: CategoryAxis,
    [TimeAxis.type]: TimeAxis,
    [GroupedCategoryAxis.type]: GroupedCategoryAxis,
    [LogAxis.type]: LogAxis,
};
export function registerAxis(axisType, ctor) {
    AXIS_CONSTRUCTORS[axisType] = ctor;
}
export function getAxis(axisType, moduleCtx) {
    const axisConstructor = AXIS_CONSTRUCTORS[axisType];
    if (axisConstructor) {
        return new axisConstructor(moduleCtx);
    }
    throw new Error(`ZING Charts - unknown axis type: ${axisType}`);
}
export const AXIS_TYPES = {
    has(axisType) {
        return Object.hasOwn(AXIS_CONSTRUCTORS, axisType);
    },
    get axesTypes() {
        return Object.keys(AXIS_CONSTRUCTORS);
    },
};
const AXIS_THEME_TEMPLATES = {};
export function registerAxisThemeTemplate(axisType, theme) {
    AXIS_THEME_TEMPLATES[axisType] = theme;
}
export function getAxisThemeTemplate(axisType) {
    var _a;
    return (_a = AXIS_THEME_TEMPLATES[axisType]) !== null && _a !== void 0 ? _a : {};
}
//# sourceMappingURL=axisTypes.js.map
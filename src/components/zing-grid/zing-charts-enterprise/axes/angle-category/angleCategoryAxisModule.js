import { ANGLE_AXIS_THEME } from '../angle/angleAxisThemes';
import { AngleCategoryAxis } from './angleCategoryAxis';
export const AngleCategoryAxisModule = {
    type: 'axis',
    optionsKey: 'axes[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],
    identifier: 'angle-category',
    instanceConstructor: AngleCategoryAxis,
    themeTemplate: ANGLE_AXIS_THEME,
};
//# sourceMappingURL=angleCategoryAxisModule.js.map
import { RADIUS_AXIS_THEME } from '../radius/radiusAxisThemes';
import { RadiusCategoryAxis } from './radiusCategoryAxis';
export const RadiusCategoryAxisModule = {
    type: 'axis',
    optionsKey: 'axes[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],
    identifier: 'radius-category',
    instanceConstructor: RadiusCategoryAxis,
    themeTemplate: RADIUS_AXIS_THEME,
};
//# sourceMappingURL=radiusCategoryAxisModule.js.map
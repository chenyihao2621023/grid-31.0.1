import { RADIUS_AXIS_THEME } from '../radius/radiusAxisThemes';
import { RadiusNumberAxis } from './radiusNumberAxis';
export const RadiusNumberAxisModule = {
    type: 'axis',
    optionsKey: 'axes[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],
    identifier: 'radius-number',
    instanceConstructor: RadiusNumberAxis,
    themeTemplate: RADIUS_AXIS_THEME,
};

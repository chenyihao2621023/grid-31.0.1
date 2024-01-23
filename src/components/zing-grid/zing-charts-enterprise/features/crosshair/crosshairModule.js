import { Crosshair } from './crosshair';
import { AXIS_CROSSHAIR_THEME } from './crosshairTheme';
export const CrosshairModule = {
    type: 'axis-option',
    optionsKey: 'crosshair',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    axisTypes: ['category', 'number', 'log', 'time'],
    instanceConstructor: Crosshair,
    themeTemplate: AXIS_CROSSHAIR_THEME,
};

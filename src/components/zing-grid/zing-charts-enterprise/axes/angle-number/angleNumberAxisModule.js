import { ANGLE_AXIS_THEME } from '../angle/angleAxisThemes';
import { AngleNumberAxis } from './angleNumberAxis';
export const AngleNumberAxisModule = {
  type: 'axis',
  optionsKey: 'axes[]',
  packageType: 'enterprise',
  chartTypes: ['polar'],
  identifier: 'angle-number',
  instanceConstructor: AngleNumberAxis,
  themeTemplate: ANGLE_AXIS_THEME
};
import { GradientLegend } from './gradientLegend';
import { GRADIENT_LEGEND_THEME } from './gradientLegendThemes';
export const GradientLegendModule = {
  type: 'legend',
  optionsKey: 'gradientLegend',
  packageType: 'enterprise',
  chartTypes: ['cartesian', 'polar', 'hierarchy'],
  identifier: 'gradient',
  instanceConstructor: GradientLegend,
  themeTemplate: GRADIENT_LEGEND_THEME
};
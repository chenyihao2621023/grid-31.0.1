import { Background } from './background';
export const BackgroundModule = {
    type: 'root',
    optionsKey: 'background',
    packageType: 'community',
    chartTypes: ['cartesian', 'polar', 'hierarchy'],
    instanceConstructor: Background,
};

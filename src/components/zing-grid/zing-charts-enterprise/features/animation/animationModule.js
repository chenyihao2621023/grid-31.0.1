import { Animation } from './animation';
export const AnimationModule = {
    type: 'root',
    optionsKey: 'animation',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'polar', 'hierarchy'],
    instanceConstructor: Animation,
    themeTemplate: {
        animation: {
            enabled: true,
        },
    },
};

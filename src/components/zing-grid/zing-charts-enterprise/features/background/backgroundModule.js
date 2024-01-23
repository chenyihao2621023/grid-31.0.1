import { Background } from './background';
import { BackgroundImage } from './backgroundImage';
export const BackgroundModule = {
    type: 'root',
    optionsKey: 'background',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'polar', 'hierarchy'],
    optionConstructors: {
        'background.image': BackgroundImage,
    },
    instanceConstructor: Background,
};

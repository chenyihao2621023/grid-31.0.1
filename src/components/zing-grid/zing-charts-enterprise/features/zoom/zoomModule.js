import { Zoom } from './zoom';
export const ZoomModule = {
    type: 'root',
    optionsKey: 'zoom',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    instanceConstructor: Zoom,
    conflicts: ['navigator'],
    themeTemplate: {
        zoom: { enabled: false },
    },
};

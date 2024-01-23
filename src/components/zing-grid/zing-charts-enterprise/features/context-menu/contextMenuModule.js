import { ContextMenu } from './contextMenu';
export { ContextMenu } from './contextMenu';
export const ContextMenuModule = {
    type: 'root',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'polar', 'hierarchy'],
    optionsKey: 'contextMenu',
    instanceConstructor: ContextMenu,
    themeTemplate: {
        contextMenu: {
            enabled: true,
        },
    },
};

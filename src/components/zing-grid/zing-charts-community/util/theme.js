export const singleSeriesPaletteFactory = ({ takeColors }) => {
    const { fills: [fill], strokes: [stroke], } = takeColors(1);
    return { fill, stroke };
};
export const markerPaletteFactory = (params) => {
    const { fill, stroke } = singleSeriesPaletteFactory(params);
    return { marker: { fill, stroke } };
};
//# sourceMappingURL=theme.js.map
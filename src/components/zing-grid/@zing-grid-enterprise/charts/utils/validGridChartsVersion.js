const VERSION_CHECKING_FIRST_GRID_MAJOR_VERSION = 28;
const VERSION_CHECKING_FIRST_CHARTS_MAJOR_VERSION = 6;
function isValidVersion(version) {
  return version && version.match(/\d+\.\d+\.\d+/);
}
function isValidMajorVersion({
  gridMajorVersion,
  chartsMajorVersion
}) {
  const gridMajor = parseInt(gridMajorVersion, 10);
  const chartsMajor = parseInt(chartsMajorVersion, 10);
  const gridMajorDifference = gridMajor - VERSION_CHECKING_FIRST_GRID_MAJOR_VERSION;
  const chartsMajorDifference = chartsMajor - VERSION_CHECKING_FIRST_CHARTS_MAJOR_VERSION;
  const isFirstOrAfterVersion = gridMajorDifference >= 0;
  return gridMajorDifference === chartsMajorDifference && isFirstOrAfterVersion;
}
export function gridChartVersion(gridVersion) {
  if (!gridVersion || !isValidVersion(gridVersion)) {
    return undefined;
  }
  const [gridMajor, gridMinor] = gridVersion.split('.') || [];
  const gridMajorMinor = `${gridMajor}.${gridMinor}.x`;
  const gridMajorNumber = parseInt(gridMajor, 10);
  const chartsMajor = gridMajorNumber - VERSION_CHECKING_FIRST_GRID_MAJOR_VERSION + VERSION_CHECKING_FIRST_CHARTS_MAJOR_VERSION;
  if (chartsMajor < 0) {
    return undefined;
  }
  const chartsMinor = gridMinor;
  const chartsMajorMinor = `${chartsMajor}.${chartsMinor}.x`;
  return {
    gridMajorMinor,
    chartsMajorMinor
  };
}
export function validGridChartsVersionErrorMessage({
  type,
  gridVersion,
  chartsVersion
}) {
  const invalidMessage = 'ZING Grid: ZING Grid version is incompatible. Please see https://www.zing-grid.com/javascript-data-grid/modules/ for more information.';
  if (!gridVersion) {
    return invalidMessage;
  }
  const version = gridChartVersion(gridVersion);
  if (!version) {
    return invalidMessage;
  }
  const {
    gridMajorMinor,
    chartsMajorMinor
  } = version;
  if (type === 'incompatible') {
    return `ZING Grid version ${gridVersion} and ZING Charts version ${chartsVersion} is not supported. ZING Grid version ${gridMajorMinor} should be used with ZING Chart ${chartsMajorMinor}. Please see https://www.zing-grid.com/javascript-data-grid/modules/ for more information.`;
  } else if (type === 'invalidCharts') {
    return `ZING Grid version ${gridMajorMinor} should be used with ZING Chart ${chartsMajorMinor}. Please see https://www.zing-grid.com/javascript-data-grid/modules/ for more information.`;
  }
  return invalidMessage;
}
export function validGridChartsVersion({
  gridVersion,
  chartsVersion
}) {
  if (!isValidVersion(chartsVersion)) {
    return {
      isValid: false,
      message: validGridChartsVersionErrorMessage({
        type: 'invalidCharts',
        gridVersion,
        chartsVersion
      })
    };
  }
  if (!isValidVersion(gridVersion)) {
    return {
      isValid: false,
      message: validGridChartsVersionErrorMessage({
        type: 'invalidGrid',
        gridVersion,
        chartsVersion
      })
    };
  }
  const [gridMajor, gridMinor] = gridVersion.split('.') || [];
  const [chartsMajor, chartsMinor] = chartsVersion.split('.') || [];
  const isValidMajor = isValidMajorVersion({
    gridMajorVersion: gridMajor,
    chartsMajorVersion: chartsMajor
  });
  if (isValidMajor && gridMinor === chartsMinor) {
    return {
      isValid: true
    };
  } else if (!isValidMajor || gridMinor !== chartsMinor) {
    return {
      isValid: false,
      message: validGridChartsVersionErrorMessage({
        type: 'incompatible',
        gridVersion,
        chartsVersion
      })
    };
  }
  return {
    isValid: false,
    message: validGridChartsVersionErrorMessage({
      type: 'invalid',
      gridVersion,
      chartsVersion
    })
  };
}
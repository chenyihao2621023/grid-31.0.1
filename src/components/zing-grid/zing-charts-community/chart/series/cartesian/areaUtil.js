import { pairCategoryData, pairContinuousData, prepareLinePathAnimationFns } from './lineUtil';
import { prepareMarkerAnimation } from './markerUtil';
import { renderPartialPath } from './pathUtil';
export var AreaSeriesTag;
(function (AreaSeriesTag) {
  AreaSeriesTag[AreaSeriesTag["Fill"] = 0] = "Fill";
  AreaSeriesTag[AreaSeriesTag["Stroke"] = 1] = "Stroke";
  AreaSeriesTag[AreaSeriesTag["Marker"] = 2] = "Marker";
  AreaSeriesTag[AreaSeriesTag["Label"] = 3] = "Label";
})(AreaSeriesTag || (AreaSeriesTag = {}));
function splitFillPoints(context) {
  const {
    points
  } = context.fillData;
  return {
    top: points.slice(0, points.length / 2),
    bottom: points.slice(points.length / 2).reverse()
  };
}
function prepPoints(key, ctx, points) {
  return {
    scales: ctx.scales,
    nodeData: points[key],
    visible: ctx.visible
  };
}
function pairFillCategoryData(newData, oldData, diff) {
  const oldPoints = splitFillPoints(oldData);
  const newPoints = splitFillPoints(newData);
  const pairOpts = {
    multiDatum: true
  };
  return {
    top: pairCategoryData(prepPoints('top', newData, newPoints), prepPoints('top', oldData, oldPoints), diff, pairOpts),
    bottom: pairCategoryData(prepPoints('bottom', newData, newPoints), prepPoints('bottom', oldData, oldPoints), diff, pairOpts)
  };
}
function pairFillContinuousData(newData, oldData) {
  const oldPoints = splitFillPoints(oldData);
  const newPoints = splitFillPoints(newData);
  return {
    top: pairContinuousData(prepPoints('top', newData, newPoints), prepPoints('top', oldData, oldPoints)),
    bottom: pairContinuousData(prepPoints('bottom', newData, newPoints), prepPoints('bottom', oldData, oldPoints))
  };
}
export function prepareAreaPathAnimation(newData, oldData, diff) {
  var _a;
  const isCategoryBased = ((_a = newData.scales.x) === null || _a === void 0 ? void 0 : _a.type) === 'category';
  let status = 'updated';
  if (oldData.visible && !newData.visible) {
    status = 'removed';
  } else if (!oldData.visible && newData.visible) {
    status = 'added';
  }
  const prepareMarkerPairs = () => {
    if (isCategoryBased) {
      return pairCategoryData(newData, oldData, diff, {
        backfillSplitMode: 'static',
        multiDatum: true
      });
    }
    return pairContinuousData(newData, oldData, {
      backfillSplitMode: 'static'
    });
  };
  const prepareFillPairs = () => {
    if (isCategoryBased) {
      return pairFillCategoryData(newData, oldData, diff);
    }
    return pairFillContinuousData(newData, oldData);
  };
  const {
    resultMap: markerPairMap
  } = prepareMarkerPairs();
  const {
    top,
    bottom
  } = prepareFillPairs();
  if (markerPairMap === undefined || top.result === undefined || bottom.result === undefined) {
    return;
  }
  const pairData = [...top.result, ...bottom.result.reverse()];
  const fill = prepareLinePathAnimationFns(newData, oldData, pairData, 'none', renderPartialPath);
  const marker = prepareMarkerAnimation(markerPairMap, status);
  return {
    fill,
    marker
  };
}
export function gridLayout({
  orientation,
  bboxes,
  maxHeight,
  maxWidth,
  itemPaddingY = 0,
  itemPaddingX = 0,
  forceResult = false
}) {
  const horizontal = orientation === 'horizontal';
  const primary = {
    max: horizontal ? maxWidth : maxHeight,
    fn: horizontal ? b => b.width : b => b.height,
    padding: horizontal ? itemPaddingX : itemPaddingY
  };
  const secondary = {
    max: !horizontal ? maxWidth : maxHeight,
    fn: !horizontal ? b => b.width : b => b.height,
    padding: !horizontal ? itemPaddingX : itemPaddingY
  };
  let processedBBoxCount = 0;
  const rawPages = [];
  while (processedBBoxCount < bboxes.length) {
    const unprocessedBBoxes = bboxes.slice(processedBBoxCount);
    const result = processBBoxes(unprocessedBBoxes, processedBBoxCount, primary, secondary, forceResult);
    if (!result) {
      return;
    }
    processedBBoxCount += result.processedBBoxCount;
    rawPages.push(result.pageIndices);
  }
  return buildPages(rawPages, orientation, bboxes, itemPaddingY, itemPaddingX);
}
function processBBoxes(bboxes, indexOffset, primary, secondary, forceResult) {
  const minGuess = 1;
  let startingGuess = estimateStartingGuess(bboxes, primary);
  if (startingGuess < minGuess) {
    if (!forceResult) {
      return undefined;
    }
    startingGuess = minGuess;
  }
  for (let guess = startingGuess; guess >= minGuess; guess--) {
    const pageIndices = calculatePage(bboxes, indexOffset, guess, primary, secondary, forceResult);
    if (pageIndices == null && guess <= minGuess) {
      return undefined;
    }
    if (pageIndices == null) {
      continue;
    }
    if (typeof pageIndices === 'number') {
      if (pageIndices <= minGuess) {
        return undefined;
      }
      guess = pageIndices < guess && pageIndices > minGuess ? pageIndices : guess;
      continue;
    }
    const processedBBoxCount = pageIndices.length * pageIndices[0].length;
    return {
      processedBBoxCount,
      pageIndices
    };
  }
}
function calculatePage(bboxes, indexOffset, primaryCount, primary, secondary, forceResult) {
  var _a;
  const result = [];
  let sumSecondary = 0;
  let currentMaxSecondary = 0;
  let currentPrimaryIndices = [];
  const maxPrimaryValues = [];
  for (let bboxIndex = 0; bboxIndex < bboxes.length; bboxIndex++) {
    const primaryValueIdx = (bboxIndex + primaryCount) % primaryCount;
    if (primaryValueIdx === 0) {
      sumSecondary += currentMaxSecondary;
      currentMaxSecondary = 0;
      if (currentPrimaryIndices.length > 0) {
        result.push(currentPrimaryIndices);
      }
      currentPrimaryIndices = [];
    }
    const primaryValue = primary.fn(bboxes[bboxIndex]) + primary.padding;
    maxPrimaryValues[primaryValueIdx] = Math.max((_a = maxPrimaryValues[primaryValueIdx]) !== null && _a !== void 0 ? _a : 0, primaryValue);
    currentMaxSecondary = Math.max(currentMaxSecondary, secondary.fn(bboxes[bboxIndex]) + secondary.padding);
    const currentSecondaryDimension = sumSecondary + currentMaxSecondary;
    const returnResult = !forceResult || result.length > 0;
    if (currentSecondaryDimension > secondary.max && returnResult) {
      currentPrimaryIndices = [];
      break;
    }
    const sumPrimary = maxPrimaryValues.reduce((sum, next) => sum + next, 0);
    if (sumPrimary > primary.max && !forceResult) {
      if (maxPrimaryValues.length < primaryCount) {
        return maxPrimaryValues.length;
      }
      return undefined;
    }
    currentPrimaryIndices.push(bboxIndex + indexOffset);
  }
  if (currentPrimaryIndices.length > 0) {
    result.push(currentPrimaryIndices);
  }
  return result.length > 0 ? result : undefined;
}
function buildPages(rawPages, orientation, bboxes, itemPaddingY, itemPaddingX) {
  let maxPageWidth = 0;
  let maxPageHeight = 0;
  const pages = rawPages.map(indices => {
    if (orientation === 'horizontal') {
      indices = transpose(indices);
    }
    let endIndex = 0;
    const columns = indices.map(colIndices => {
      const colBBoxes = colIndices.map(bboxIndex => {
        endIndex = Math.max(bboxIndex, endIndex);
        return bboxes[bboxIndex];
      });
      let columnHeight = 0;
      let columnWidth = 0;
      colBBoxes.forEach(bbox => {
        columnHeight += bbox.height + itemPaddingY;
        columnWidth = Math.max(columnWidth, bbox.width + itemPaddingX);
      });
      return {
        indices: colIndices,
        bboxes: colBBoxes,
        columnHeight: Math.ceil(columnHeight),
        columnWidth: Math.ceil(columnWidth)
      };
    });
    let pageWidth = 0;
    let pageHeight = 0;
    columns.forEach(column => {
      pageWidth += column.columnWidth;
      pageHeight = Math.max(pageHeight, column.columnHeight);
    });
    maxPageWidth = Math.max(pageWidth, maxPageWidth);
    maxPageHeight = Math.max(pageHeight, maxPageHeight);
    return {
      columns,
      startIndex: indices[0][0],
      endIndex,
      pageWidth,
      pageHeight
    };
  });
  return {
    pages,
    maxPageWidth,
    maxPageHeight
  };
}
function transpose(data) {
  const result = [];
  for (const _ of data[0]) {
    result.push([]);
  }
  data.forEach((innerData, dataIdx) => {
    innerData.forEach((item, itemIdx) => {
      result[itemIdx][dataIdx] = item;
    });
  });
  return result;
}
function estimateStartingGuess(bboxes, primary) {
  const n = bboxes.length;
  let primarySum = 0;
  for (let bboxIndex = 0; bboxIndex < n; bboxIndex++) {
    primarySum += primary.fn(bboxes[bboxIndex]) + primary.padding;
    if (primarySum > primary.max) {
      const ratio = n / bboxIndex;
      if (ratio < 2) {
        return Math.ceil(n / 2);
      }
      return bboxIndex;
    }
  }
  return n;
}
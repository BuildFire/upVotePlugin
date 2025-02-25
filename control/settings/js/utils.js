const utils = {
  checkEquality(val1, val2) {
    if (val1 === val2) {
      return true;
    }

    if (typeof val1 !== 'object' || typeof val2 !== 'object' || val1 === null || val2 === null) {
      return false;
    }

    if (Array.isArray(val1) && Array.isArray(val2)) {
      return utils.deepCompareArrays(val1, val2);
    }

    if (!Array.isArray(val1) && !Array.isArray(val2)) {
      return utils.deepCompareObjects(val1, val2);
    }

    return false;
  },

  deepCompareObjects(obj1, obj2) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (let key of keys1) {
      if (!keys2.includes(key) || !utils.checkEquality(obj1[key], obj2[key])) {
        return false;
      }
    }

    return true;
  },

  deepCompareArrays(arr1, arr2) {
    if (arr1.length !== arr2.length) {
      return false;
    }

    for (let i = 0; i < arr1.length; i++) {
      if (!utils.checkEquality(arr1[i], arr2[i])) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

/**
 * Retrieve an object's own values as an array. If you want the values in the
 * protoype chain, too, use getObjectValuesIncludingPrototype.
 *
 * If you are looking for a function that creates an Array instance based
 * on an "Array-like" object, use createArrayFrom instead.
 *
 * @param {object} obj An object.
 * @return {array}     The object's values.
 */
export default function getOwnObjectValues<TValue>(
  obj: Record<string, TValue>,
): Array<TValue> {
  return Object.keys(obj).map(key => obj[key]);
}

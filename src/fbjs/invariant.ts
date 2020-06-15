/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 */

const validateFormat =
  process.env.NODE_ENV !== 'production'
    ? function() {
        //
      }
    : function(format: string | undefined) {
        if (format === undefined) {
          throw new Error('invariant(...): Second argument must be a string.');
        }
      };
/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments to provide
 * information about what broke and what you were expecting.
 *
 * The invariant message will be stripped in production, but the invariant will
 * remain to ensure logic does not differ in production.
 */

export default function invariant(
  condition: any,
  format: string | undefined,
  ...rest: any[]
): void {
  const _len = arguments.length;
  const args = new Array(_len > 2 ? _len - 2 : 0);
  for (let _key = 2; _key < _len; _key++) {
    // eslint-disable-next-line prefer-rest-params
    args[_key - 2] = rest[_key];
  }

  validateFormat(format);

  if (!condition) {
    let error;

    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
          'for the full error message and additional helpful warnings.',
      );
    } else {
      let argIndex = 0;
      error = new Error(
        format.replace(/%s/g, function() {
          return String(args[argIndex++]);
        }),
      );
      error.name = 'Invariant Violation';
    }

    (error as Record<string, any>).framesToPop = 1; // Skip invariant's own stack frame.

    throw error;
  }
}

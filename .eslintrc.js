/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  extends: [
    'prettier',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/no-inferrable-types': 0,
    '@typescript-eslint/no-use-before-define': 0,
    '@typescript-eslint/no-parameter-properties': 0,
    '@typescript-eslint/explicit-function-return-type': 0,
    "@typescript-eslint/no-unused-vars": ["error",  { "varsIgnorePattern": "^_", "argsIgnorePattern": "^_" }],
    'no-var': ['error'],
    'prefer-const': [
      'error',
      {
        destructuring: 'all',
      },
    ],
  },
  overrides: [
    {
      files: ['examples/draft-0-10-0/**', 'examples/draft-0-9-1/**'],
      rules: {
        'jsx-a11y/no-static-element-interactions': 0,
        'no-console': 0,
      },
    },
  ],
};

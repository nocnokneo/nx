import { join, normalize } from '@angular-devkit/core';
import { chain, noop, Tree } from '@angular-devkit/schematics';
import { formatFiles, readWorkspace, updateJsonInTree } from '@nrwl/workspace';
import * as assert from 'assert';
import type { Linter } from 'eslint';

/**
 * We want to update the JSON in such a way that we:
 * - extend from our Nx shareable configs where applicable
 * - remove as much duplication between the JSON and the underlying
 * shareable config as is safely possible
 */
function updateRootESLintConfig(host: Tree) {
  return host.exists('.eslintrc.json')
    ? updateJsonInTree('.eslintrc.json', (json) => {
        updateExtendsAndRemoveDuplication(
          json,
          currentTypescriptConfig,
          true,
          'plugin:@nrwl/nx/typescript'
        );

        /**
         * We always want to explicitly include the @nrwl/nx plugin
         * because we continue to use the @nrwl/nx/enforce-module-boundaries
         * in the first party config and it helps make things clearer
         */
        updatePluginsAndRemoveDuplication(
          json,
          currentTypescriptConfig,
          true,
          '@nrwl/nx'
        );

        updateParserOptionsAndRemoveDuplication(json, currentTypescriptConfig);

        /**
         * In the case of the existing Nx root .eslintrc.json out of the box,
         * there is a single overrides for .tsx files. This is now covered
         * by the shared config, so if the user still has that defined we can
         * also remove that safely.
         */
        updateOverridesAndRemoveDuplication(
          json,
          currentTypescriptConfig,
          true
        );

        updateObjPropAndRemoveDuplication(
          json,
          currentTypescriptConfig,
          'rules',
          false
        );

        if (json.parser === currentTypescriptConfig.parser) {
          delete json.parser;
        }

        return json;
      })
    : noop();
}

function updateReactESLintConfigs(host: Tree) {
  const workspace = readWorkspace(host);
  return chain([
    ...Object.keys(workspace.projects).map((k) => {
      const p = workspace.projects[k];
      const eslintConfigPath = join(normalize(p.root), '.eslintrc.json');

      if (!host.exists(eslintConfigPath)) {
        return noop();
      }

      return updateJsonInTree(eslintConfigPath, (json) => {
        /**
         * There isn't a way to know for sure if a project was started with the Nx
         * original inline React ESLint config (for applications it is easy to know
         * from the workspace.json, but that is not the case for all libraries).
         *
         * We therefore try and infer it based on the presence of react eslint plugins
         * within the config that is currently there.
         */
        if (
          json.plugins?.includes('react') ||
          json.plugins?.includes('react-hooks') ||
          json.plugins?.includes('jsx-a11y')
        ) {
          updateExtendsAndRemoveDuplication(
            json,
            currentReactConfig,
            true,
            'plugin:@nrwl/nx/react'
          );

          updatePluginsAndRemoveDuplication(json, currentReactConfig, true);

          updateObjPropAndRemoveDuplication(
            json,
            currentReactConfig,
            'rules',
            false
          );

          updateObjPropAndRemoveDuplication(
            json,
            currentReactConfig,
            'env',
            true
          );

          updateObjPropAndRemoveDuplication(
            json,
            currentReactConfig,
            'settings',
            true
          );
        }
        return json;
      });
    }),
  ]);
}

export default function () {
  return chain([
    updateRootESLintConfig,
    updateReactESLintConfigs,
    formatFiles(),
  ]);
}

const currentReactConfig: Linter.Config = {
  rules: {
    'array-callback-return': 'warn',
    'dot-location': ['warn', 'property'],
    eqeqeq: ['warn', 'smart'],
    'new-parens': 'warn',
    'no-caller': 'warn',
    'no-cond-assign': ['warn', 'except-parens'],
    'no-const-assign': 'warn',
    'no-control-regex': 'warn',
    'no-delete-var': 'warn',
    'no-dupe-args': 'warn',
    'no-dupe-keys': 'warn',
    'no-duplicate-case': 'warn',
    'no-empty-character-class': 'warn',
    'no-empty-pattern': 'warn',
    'no-eval': 'warn',
    'no-ex-assign': 'warn',
    'no-extend-native': 'warn',
    'no-extra-bind': 'warn',
    'no-extra-label': 'warn',
    'no-fallthrough': 'warn',
    'no-func-assign': 'warn',
    'no-implied-eval': 'warn',
    'no-invalid-regexp': 'warn',
    'no-iterator': 'warn',
    'no-label-var': 'warn',
    'no-labels': ['warn', { allowLoop: true, allowSwitch: false }],
    'no-lone-blocks': 'warn',
    'no-loop-func': 'warn',
    'no-mixed-operators': [
      'warn',
      {
        groups: [
          ['&', '|', '^', '~', '<<', '>>', '>>>'],
          ['==', '!=', '===', '!==', '>', '>=', '<', '<='],
          ['&&', '||'],
          ['in', 'instanceof'],
        ],
        allowSamePrecedence: false,
      },
    ],
    'no-multi-str': 'warn',
    'no-native-reassign': 'warn',
    'no-negated-in-lhs': 'warn',
    'no-new-func': 'warn',
    'no-new-object': 'warn',
    'no-new-symbol': 'warn',
    'no-new-wrappers': 'warn',
    'no-obj-calls': 'warn',
    'no-octal': 'warn',
    'no-octal-escape': 'warn',
    'no-redeclare': 'warn',
    'no-regex-spaces': 'warn',
    'no-restricted-syntax': ['warn', 'WithStatement'],
    'no-script-url': 'warn',
    'no-self-assign': 'warn',
    'no-self-compare': 'warn',
    'no-sequences': 'warn',
    'no-shadow-restricted-names': 'warn',
    'no-sparse-arrays': 'warn',
    'no-template-curly-in-string': 'warn',
    'no-this-before-super': 'warn',
    'no-throw-literal': 'warn',
    'no-restricted-globals': [
      'error',
      'addEventListener',
      'blur',
      'close',
      'closed',
      'confirm',
      'defaultStatus',
      'defaultstatus',
      'event',
      'external',
      'find',
      'focus',
      'frameElement',
      'frames',
      'history',
      'innerHeight',
      'innerWidth',
      'length',
      'location',
      'locationbar',
      'menubar',
      'moveBy',
      'moveTo',
      'name',
      'onblur',
      'onerror',
      'onfocus',
      'onload',
      'onresize',
      'onunload',
      'open',
      'opener',
      'opera',
      'outerHeight',
      'outerWidth',
      'pageXOffset',
      'pageYOffset',
      'parent',
      'print',
      'removeEventListener',
      'resizeBy',
      'resizeTo',
      'screen',
      'screenLeft',
      'screenTop',
      'screenX',
      'screenY',
      'scroll',
      'scrollbars',
      'scrollBy',
      'scrollTo',
      'scrollX',
      'scrollY',
      'self',
      'status',
      'statusbar',
      'stop',
      'toolbar',
      'top',
    ],
    'no-unexpected-multiline': 'warn',
    'no-unreachable': 'warn',
    'no-unused-expressions': 'off',
    'no-unused-labels': 'warn',
    'no-useless-computed-key': 'warn',
    'no-useless-concat': 'warn',
    'no-useless-escape': 'warn',
    'no-useless-rename': [
      'warn',
      {
        ignoreDestructuring: false,
        ignoreImport: false,
        ignoreExport: false,
      },
    ],
    'no-with': 'warn',
    'no-whitespace-before-property': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'require-yield': 'warn',
    'rest-spread-spacing': ['warn', 'never'],
    strict: ['warn', 'never'],
    'unicode-bom': ['warn', 'never'],
    'use-isnan': 'warn',
    'valid-typeof': 'warn',
    'no-restricted-properties': [
      'error',
      {
        object: 'require',
        property: 'ensure',
        message:
          'Please use import() instead. More info: https://facebook.github.io/create-react-app/docs/code-splitting',
      },
      {
        object: 'System',
        property: 'import',
        message:
          'Please use import() instead. More info: https://facebook.github.io/create-react-app/docs/code-splitting',
      },
    ],
    'getter-return': 'warn',
    'import/first': 'error',
    'import/no-amd': 'error',
    'import/no-webpack-loader-syntax': 'error',
    'react/forbid-foreign-prop-types': ['warn', { allowInPropTypes: true }],
    'react/jsx-no-comment-textnodes': 'warn',
    'react/jsx-no-duplicate-props': 'warn',
    'react/jsx-no-target-blank': 'warn',
    'react/jsx-no-undef': 'error',
    'react/jsx-pascal-case': ['warn', { allowAllCaps: true, ignore: [] }],
    'react/jsx-uses-react': 'warn',
    'react/jsx-uses-vars': 'warn',
    'react/no-danger-with-children': 'warn',
    'react/no-direct-mutation-state': 'warn',
    'react/no-is-mounted': 'warn',
    'react/no-typos': 'error',
    'react/react-in-jsx-scope': 'error',
    'react/require-render-return': 'error',
    'react/style-prop-object': 'warn',
    'react/jsx-no-useless-fragment': 'warn',
    'jsx-a11y/accessible-emoji': 'warn',
    'jsx-a11y/alt-text': 'warn',
    'jsx-a11y/anchor-has-content': 'warn',
    'jsx-a11y/anchor-is-valid': [
      'warn',
      { aspects: ['noHref', 'invalidHref'] },
    ],
    'jsx-a11y/aria-activedescendant-has-tabindex': 'warn',
    'jsx-a11y/aria-props': 'warn',
    'jsx-a11y/aria-proptypes': 'warn',
    'jsx-a11y/aria-role': 'warn',
    'jsx-a11y/aria-unsupported-elements': 'warn',
    'jsx-a11y/heading-has-content': 'warn',
    'jsx-a11y/iframe-has-title': 'warn',
    'jsx-a11y/img-redundant-alt': 'warn',
    'jsx-a11y/no-access-key': 'warn',
    'jsx-a11y/no-distracting-elements': 'warn',
    'jsx-a11y/no-redundant-roles': 'warn',
    'jsx-a11y/role-has-required-aria-props': 'warn',
    'jsx-a11y/role-supports-aria-props': 'warn',
    'jsx-a11y/scope': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'default-case': 'off',
    'no-dupe-class-members': 'off',
    'no-undef': 'off',
    '@typescript-eslint/consistent-type-assertions': 'warn',
    'no-array-constructor': 'off',
    '@typescript-eslint/no-array-constructor': 'warn',
    '@typescript-eslint/no-namespace': 'error',
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': [
      'warn',
      {
        functions: false,
        classes: false,
        variables: false,
        typedefs: false,
      },
    ],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { args: 'none', ignoreRestSiblings: true },
    ],
    'no-useless-constructor': 'off',
    '@typescript-eslint/no-useless-constructor': 'warn',
    '@typescript-eslint/no-unused-expressions': [
      'error',
      {
        allowShortCircuit: true,
        allowTernary: true,
        allowTaggedTemplates: true,
      },
    ],
  },
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    jest: true,
    node: true,
  },
  settings: { react: { version: 'detect' } },
  plugins: ['import', 'jsx-a11y', 'react', 'react-hooks'],
};

const currentTypescriptConfig: Linter.Config = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'prettier/@typescript-eslint',
  ],
  rules: {
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-parameter-properties': 'off',
  },
  overrides: [
    {
      files: ['*.tsx'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
  ],
};

function ensureStringArray(val: string | string[]): string[] {
  if (typeof val === 'string') {
    return [val];
  }
  return val || [];
}

export function updateExtendsAndRemoveDuplication(
  json: Linter.Config,
  configBeingExtended: Linter.Config,
  deleteIfUltimatelyEmpty: boolean,
  extendsToAdd: string
): void {
  // Extends can be a string or an array, normalize first
  json.extends = ensureStringArray(json.extends);
  configBeingExtended.extends = ensureStringArray(configBeingExtended.extends);

  json.extends.unshift(extendsToAdd);
  json.extends = json.extends.filter(
    (extended) => !configBeingExtended.extends.includes(extended)
  );
  json.extends = Array.from(new Set(json.extends));
  if (deleteIfUltimatelyEmpty && json.extends.length === 0) {
    delete json.extends;
  }
}

export function updatePluginsAndRemoveDuplication(
  json: Linter.Config,
  configBeingExtended: Linter.Config,
  deleteIfUltimatelyEmpty: boolean,
  ensurePlugin?: string
): void {
  json.plugins ||= [];
  configBeingExtended.plugins ||= [];
  if (ensurePlugin && !json.plugins.includes(ensurePlugin)) {
    json.plugins.unshift(ensurePlugin);
  }
  json.plugins = json.plugins.filter(
    (extended: string) => !configBeingExtended.plugins.includes(extended)
  );
  json.plugins = Array.from(new Set(json.plugins));
  if (deleteIfUltimatelyEmpty && json.plugins.length === 0) {
    delete json.plugins;
  }
}

export function updateParserOptionsAndRemoveDuplication(
  json: Linter.Config,
  configBeingExtended: Linter.Config
): void {
  json.parserOptions ||= {};
  configBeingExtended.parserOptions ||= {};
  /**
   * If the user is still using the 2018 ecmaVersion that Nx set for them
   * previously we can just remove it and let them inherit the new 2020 value.
   * If the user has set something else (other than 2018 or 2020), we just leave it.
   */
  if (
    Number(json.parserOptions.ecmaVersion) === 2018 ||
    Number(json.parserOptions.ecmaVersion) ===
      Number(configBeingExtended.parserOptions.ecmaVersion)
  ) {
    delete json.parserOptions.ecmaVersion;
  }

  for (const [parserOptionName, parserOptionVal] of Object.entries(
    json.parserOptions
  )) {
    if (
      parserOptionVal === configBeingExtended.parserOptions[parserOptionName]
    ) {
      delete json.parserOptions[parserOptionName];
    }
  }
}

export function updateObjPropAndRemoveDuplication(
  json: Linter.Config,
  configBeingExtended: Linter.Config,
  objPropName: string,
  deleteIfUltimatelyEmpty: boolean
): void {
  json[objPropName] ||= {};
  configBeingExtended[objPropName] ||= {};

  for (const [name, val] of Object.entries(json[objPropName])) {
    const valueOfSamePropInExtendedConfig =
      configBeingExtended[objPropName][name];

    try {
      assert.deepStrictEqual(val, valueOfSamePropInExtendedConfig);
      delete json[objPropName][name];
    } catch {}
  }

  if (deleteIfUltimatelyEmpty && Object.keys(json[objPropName]).length === 0) {
    delete json[objPropName];
  }
}

export function updateOverridesAndRemoveDuplication(
  json: Linter.Config,
  configBeingExtended: Linter.Config,
  deleteIfUltimatelyEmpty: boolean
): void {
  if (!Array.isArray(json.overrides) || !json.overrides.length) {
    return;
  }
  if (
    !Array.isArray(configBeingExtended.overrides) ||
    !configBeingExtended.overrides.length
  ) {
    return;
  }
  json.overrides = json.overrides.filter((o) => {
    for (const extendedOverride of configBeingExtended.overrides) {
      try {
        assert.deepStrictEqual(o, extendedOverride);
        return false;
      } catch {}
    }
    return false;
  });
  if (deleteIfUltimatelyEmpty && json.overrides.length === 0) {
    delete json.overrides;
  }
}
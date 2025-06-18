export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    rules: {
      // Possible Errors
      'no-debugger': 'error',
      'no-duplicate-case': 'error',
      'no-empty': 'error',
      'no-extra-semi': 'error',
      'no-unreachable': 'error',
      'valid-typeof': 'error',

      // Best Practices
      curly: 'error',
      eqeqeq: 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-return-assign': 'error',
      'no-unused-expressions': 'error',
      'no-useless-return': 'error',

      // Variables
      'no-delete-var': 'error',
      'no-undef': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // Stylistic Issues
      indent: ['error', 2],
      quotes: ['error', 'single', { allowTemplateLiterals: true }],
      semi: ['error', 'always'],
      'comma-dangle': ['error', 'never'],
      'brace-style': ['error', '1tbs'],
      'keyword-spacing': 'error',
      'space-before-blocks': 'error',
      'space-infix-ops': 'error'
    }
  },
  {
    files: ['**/*.test.js', '**/*.spec.js', '**/tests/**/*.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly'
      }
    },
    rules: {
      'no-console': 'off'
    }
  }
];

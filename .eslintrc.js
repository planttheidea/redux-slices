const config = {
    env: {
        browser: true,
        node: true
    },
    extends: [
        'eslint:recommended',
        "plugin:@typescript-eslint/eslint-recommended",
        'plugin:@typescript-eslint/recommended'
    ],
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
    },
    plugins: ['@typescript-eslint'],
    rules: {
        "@typescript-eslint/ban-ts-comment": 0
    },
    settings: {
        react: {
            version: 'detect'
        }
    }
};

module.exports = config;
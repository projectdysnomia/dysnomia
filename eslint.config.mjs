import jsConfig from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import tsConfig from "typescript-eslint";
import globals from "globals";
import sortClassMembers from "eslint-plugin-sort-class-members";

const cjsFiles = [
    "lib/**/*.js",
    "examples/**/*.js",
    "*.js"
];

const jsFiles = [
    ...cjsFiles,
    "lib/**/*.mjs",
    "examples/**/*.mjs",
    "*.mjs"
];

const tsFiles = [
    "lib/**/*.ts",
    "examples/**/*.ts",
    "*.ts"
];

const classSortCommon = {
    groups: {
        "alphabetical-getters": [
            {
                kind: "get",
                sort: "alphabetical",
                static: false
            }
        ],
        "alphabetical-methods": [
            {
                type: "method",
                sort: "alphabetical",
                static: false
            }
        ],
        "alphabetical-properties": [
            {
                type: "property",
                sort: "alphabetical",
                static: false
            }
        ],
        "alphabetical-private-properties": [
            {
                type: "property",
                sort: "alphabetical",
                private: true
            }
        ],
        "alphabetical-conventional-private-methods": [
            {
                name: "/_.+/",
                type: "method",
                sort: "alphabetical"
            }
        ],
        "alphabetical-private-methods": [
            {
                type: "method",
                sort: "alphabetical",
                private: true
            }
        ],
        "custom-inspect-method": [
            {
                name: "[util.inspect.custom]",
                type: "method"
            }
        ],
        "screaming-snake-case-static-properties": [
            {
                name: "/^[A-Z_0-9]+$/",
                type: "property",
                static: true
            }
        ],
        "alphabetical-static-properties": [
            {
                type: "property",
                sort: "alphabetical",
                static: true
            }
        ],
        "alphabetical-static-methods": [
            {
                type: "method",
                sort: "alphabetical",
                static: true
            }
        ]
    }
};

export default tsConfig.config(
    {
        files: jsFiles,
        extends: [
            jsConfig.configs.recommended
        ],
        plugins: {
            "sort-class-members": sortClassMembers
        },
        languageOptions: {
            globals: {
                window: true,
                ...globals.node
            }
        },
        rules: {
            "curly": "error",
            "no-prototype-builtins": "off",
            "no-trailing-spaces": "error",
            "no-var": "error",
            "object-shorthand": [
                "error",
                "consistent-as-needed"
            ],
            "prefer-const": "error",
            "require-atomic-updates": "warn",
            "sort-class-members/sort-class-members": [
                "error",
                {
                    ...classSortCommon,
                    order: [
                        "[alphabetical-properties]",
                        "[alphabetical-private-properties]",
                        "constructor",
                        "update",
                        "[alphabetical-getters]",
                        "[alphabetical-methods]",
                        "[alphabetical-conventional-private-methods]",
                        "[alphabetical-private-methods]",
                        "[everything-else]",
                        "[custom-inspect-method]",
                        "toString",
                        "toJSON"
                    ]
                }
            ]
        }
    },
    {
        files: cjsFiles,
        languageOptions: {
            sourceType: "commonjs"
        }
    },
    {
        files: [
            "**/*.ts"
        ],
        extends: [
            ...tsConfig.configs.recommended
        ],
        rules: {
            "@typescript-eslint/consistent-type-definitions": "error"
        }
    },
    {
        files: [
            ...jsFiles,
            ...tsFiles
        ],
        extends: [
            stylistic.configs.customize({
                arrowParens: true,
                braceStyle: "1tbs",
                indent: 4,
                quotes: "double",
                semi: true,
                commaDangle: "never"
            })
        ],
        rules: {
            "@stylistic/keyword-spacing": [
                "error",
                {
                    after: true,
                    overrides: {
                        catch: {after: false},
                        for: {after: false},
                        if: {after: false},
                        switch: {after: false},
                        while: {after: false}
                    }
                }
            ],
            "@stylistic/object-curly-spacing": [
                "error",
                "never"
            ],
            "@stylistic/space-before-function-paren": "off"
        }
    },
    {
        files: ["index.d.ts"],
        plugins: {
            "sort-class-members": sortClassMembers
        },
        rules: {
            "@stylistic/indent": ["error", 2],
            "@stylistic/object-curly-spacing": ["error", "always"],
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/ban-ts-comment": ["error", {
                "ts-expect-error": "allow-with-description",
                "ts-ignore": "allow-with-description"
            }],
            "sort-class-members/sort-class-members": ["error", {
                ...classSortCommon,
                order: [
                    "[screaming-snake-case-static-properties]",
                    "[alphabetical-static-properties]",
                    "[alphabetical-properties]",
                    "constructor",
                    "[alphabetical-static-methods]",
                    "[alphabetical-methods]",
                    "on",
                    "[everything-else]",
                    "[custom-inspect-method]",
                    "toString",
                    "toJSON"
                ]
            }]
        }
    }
);

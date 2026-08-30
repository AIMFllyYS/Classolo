import next from 'eslint-config-next'

const featureNames = [
  'transcript',
  'notes',
  'agent',
  'settings',
  'playbook',
  'render-modules',
  'library',
  'review',
  'quiz',
]

const siblingFeatureGlobs = featureNames.flatMap((name) => [
  `../${name}`,
  `../${name}/**`,
  `../../${name}`,
  `../../${name}/**`,
])

const featureIsolationPatterns = [
  {
    group: ['@/features/*', '@/features/*/**'],
    message:
      'features must not import other features; cross-domain traffic goes through src/lib/session (ADR-0017)',
  },
  {
    group: siblingFeatureGlobs,
    message:
      'features must not import sibling features; use @/lib/session or @/lib/providers',
  },
]

const mindmapLibraryPatterns = [
  {
    group: [
      '@xyflow/react',
      '@xyflow/react/**',
      '@dagrejs/dagre',
      '@dagrejs/dagre/**',
    ],
    message:
      'import mindmap from src/components/mindmap (ADR-0005); do not import xyflow/dagre from business code',
  },
]

function writeBan(name, owner) {
  return {
    paths: [
      {
        name: `@/lib/session/writes/${name}`,
        message: `only src/features/${owner} may import session writes/${name}`,
      },
    ],
    patterns: [
      {
        group: [
          `**/session/writes/${name}`,
          `**/session/writes/${name}.*`,
        ],
        message: `only src/features/${owner} may import session writes/${name}`,
      },
    ],
  }
}

function mergeBans(bans, extraPatterns = []) {
  return {
    paths: bans.flatMap((ban) => ban.paths),
    patterns: [...extraPatterns, ...bans.flatMap((ban) => ban.patterns)],
  }
}

const electronRestrictedSyntax = [
  {
    selector:
      "MemberExpression[object.name='window'][property.name='electron']",
    message:
      'renderer must not access window.electron*; use src/lib/platform (ADR-0017)',
  },
  {
    selector:
      "MemberExpression[object.name='window'][property.name='electronAPI']",
    message:
      'renderer must not access window.electronAPI; use src/lib/platform (ADR-0017)',
  },
  {
    selector:
      "MemberExpression[object.name='window'][property.name='classolo']",
    message:
      'renderer must not access window.classolo; use src/lib/platform (ADR-0017)',
  },
  {
    selector:
      "MemberExpression[object.name='window'][property.name='classoloAPI']",
    message:
      'renderer must not access window.classoloAPI; use src/lib/platform (ADR-0017)',
  },
  {
    selector: "Identifier[name='ipcRenderer']",
    message: 'renderer must not use ipcRenderer; use src/lib/platform',
  },
]

const allWrites = mergeBans(
  [
    writeBan('transcript', 'transcript'),
    writeBan('notes', 'notes'),
    writeBan('settings', 'settings'),
    writeBan('render', 'agent'),
  ],
  [...featureIsolationPatterns, ...mindmapLibraryPatterns],
)

const eslintConfig = [
  ...next,
  {
    files: ['src/features/**/*.{ts,tsx}'],
    ignores: [
      'src/features/transcript/**',
      'src/features/notes/**',
      'src/features/settings/**',
      'src/features/agent/**',
    ],
    rules: {
      'no-restricted-imports': ['error', allWrites],
    },
  },
  {
    files: ['src/features/transcript/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        mergeBans(
          [
            writeBan('notes', 'notes'),
            writeBan('settings', 'settings'),
            writeBan('render', 'agent'),
          ],
          [...featureIsolationPatterns, ...mindmapLibraryPatterns],
        ),
      ],
    },
  },
  {
    files: ['src/features/notes/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        mergeBans(
          [
            writeBan('transcript', 'transcript'),
            writeBan('settings', 'settings'),
            writeBan('render', 'agent'),
          ],
          [...featureIsolationPatterns, ...mindmapLibraryPatterns],
        ),
      ],
    },
  },
  {
    files: ['src/features/settings/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        mergeBans(
          [
            writeBan('transcript', 'transcript'),
            writeBan('notes', 'notes'),
            writeBan('render', 'agent'),
          ],
          [...featureIsolationPatterns, ...mindmapLibraryPatterns],
        ),
      ],
    },
  },
  {
    files: ['src/features/agent/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        mergeBans(
          [
            writeBan('transcript', 'transcript'),
            writeBan('notes', 'notes'),
            writeBan('settings', 'settings'),
          ],
          [...featureIsolationPatterns, ...mindmapLibraryPatterns],
        ),
      ],
    },
  },
  {
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        mergeBans(
          [
            writeBan('transcript', 'transcript'),
            writeBan('notes', 'notes'),
            writeBan('settings', 'settings'),
            writeBan('render', 'agent'),
          ],
          mindmapLibraryPatterns,
        ),
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}', 'src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', ...electronRestrictedSyntax],
    },
  },
]

export default eslintConfig

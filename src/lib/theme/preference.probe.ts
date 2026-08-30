import {
  applyThemePreference,
  getThemePreference,
  installThemeTestHarness,
  parseThemePreference,
  resetThemeTestHarness,
  resolveHtmlTheme,
  setThemePreference,
  THEME_STORAGE_KEY,
} from './preference'

export function readThemePreferenceWritesAgreedKey(): string {
  resetThemeTestHarness()
  if (THEME_STORAGE_KEY !== 'classolo-theme') {
    throw new Error('must keep ADR-0014 localStorage key')
  }
  if (parseThemePreference(null) !== 'system') {
    throw new Error('missing key must default to system')
  }
  if (parseThemePreference('nope') !== 'system') {
    throw new Error('unknown value must default to system')
  }
  if (resolveHtmlTheme('dark', false) !== 'dark') {
    throw new Error('forced dark must win over light OS')
  }
  if (resolveHtmlTheme('light', true) !== 'light') {
    throw new Error('forced light must win over dark OS')
  }
  if (resolveHtmlTheme('system', true) !== 'dark') {
    throw new Error('system must follow prefers-color-scheme')
  }

  const harness = {
    storage: new Map<string, string>(),
    prefersDark: true,
    classes: [] as string[],
  }
  installThemeTestHarness(harness)
  setThemePreference('light')
  if (harness.storage.get(THEME_STORAGE_KEY) !== 'light') {
    throw new Error('force light must write classolo-theme')
  }
  if (harness.classes.join() !== 'light') {
    throw new Error('force light must apply .light immediately')
  }
  setThemePreference('dark')
  if (getThemePreference() !== 'dark' || harness.classes.join() !== 'dark') {
    throw new Error('force dark must persist and apply')
  }
  setThemePreference('system')
  if (harness.storage.get(THEME_STORAGE_KEY) !== 'system') {
    throw new Error('system must still write the agreed key')
  }
  if (harness.classes.join() !== 'dark') {
    throw new Error('system preference must apply current OS scheme')
  }
  harness.prefersDark = false
  applyThemePreference('system')
  if (harness.classes.join() !== 'light') {
    throw new Error('system must re-resolve when OS scheme changes')
  }
  resetThemeTestHarness()
  return `theme:key=${THEME_STORAGE_KEY};states=system,light,dark`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/preference.probe.ts',
)
if (invokedDirectly) {
  process.stdout.write(`${readThemePreferenceWritesAgreedKey()}\n`)
}

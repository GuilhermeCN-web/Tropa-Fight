import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const sourceRoot = fileURLToPath(new URL('../../src', import.meta.url))
const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx']
const forbiddenImports: Record<string, string[]> = {
  domain: ['application', 'presentation', 'infrastructure'],
  application: ['presentation', 'infrastructure'],
  presentation: ['infrastructure'],
  infrastructure: ['presentation'],
}

async function collectSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name)
      return entry.isDirectory() ? collectSourceFiles(entryPath) : [entryPath]
    }),
  )

  return nested
    .flat()
    .filter((file) => sourceExtensions.includes(path.extname(file)))
}

async function resolveSourceImport(
  fromFile: string,
  specifier: string,
): Promise<string | undefined> {
  const basePath = path.resolve(path.dirname(fromFile), specifier)
  const candidates = [
    basePath,
    ...sourceExtensions.map((extension) => `${basePath}${extension}`),
  ]

  for (const candidate of candidates) {
    try {
      await readFile(candidate)
      return candidate
    } catch {
      // Try the next supported source extension.
    }
  }

  return undefined
}

describe('layer dependencies', () => {
  it('keeps imports within the approved layer direction', async () => {
    const files = await collectSourceFiles(sourceRoot)
    const violations: string[] = []
    const importPattern =
      /^\s*import\s+(?:type\s+)?(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/gm

    for (const file of files) {
      const relativePath = path.relative(sourceRoot, file)
      const sourceLayer = relativePath.split(path.sep)[0]
      const forbiddenTargets = forbiddenImports[sourceLayer]
      if (!forbiddenTargets) continue

      const source = await readFile(file, 'utf8')
      for (const match of source.matchAll(importPattern)) {
        const specifier = match[1]
        if (!specifier.startsWith('.')) continue

        const importedFile = await resolveSourceImport(file, specifier)
        if (!importedFile) continue

        const targetLayer = path
          .relative(sourceRoot, importedFile)
          .split(path.sep)[0]
        if (forbiddenTargets.includes(targetLayer)) {
          violations.push(
            `${relativePath} imports ${targetLayer} through ${specifier}`,
          )
        }
      }
    }

    expect(violations).toEqual([])
  })
})

// TASK-021 / ADR-020: the same rules applied inside each module
// (`src/modules/<module>/<layer>/**`). Top-level `src/<layer>` files count as
// that layer. Only `presentation → infrastructure` is allowed (composition).
const moduleForbiddenImports: Record<string, string[]> = {
  domain: ['application', 'presentation', 'infrastructure'],
  application: ['presentation', 'infrastructure'],
  presentation: [],
  infrastructure: ['presentation'],
}
const layers = new Set(Object.keys(moduleForbiddenImports))

/**
 * Pre-existing violations registered in TASK-021 (identity, auth and audit
 * application services importing their own infrastructure since
 * TASK-003/004). Fixing them requires refactoring authentication and audit,
 * outside TASK-021's scope; they are tracked as technical debt for the
 * TASK-022 checkpoint. The list is closed: any new violation fails the test,
 * and an entry that disappears must be removed from here.
 */
const registeredModuleViolations = [
  'modules/audit/application/audit-service.ts imports infrastructure through ../infrastructure/audit-repository',
  'modules/auth/application/session-service.ts imports infrastructure through ../../identity/infrastructure/identity-repository',
  'modules/identity/application/identity-service.ts imports infrastructure through ../../../infrastructure/logger',
  'modules/identity/application/identity-service.ts imports infrastructure through ../infrastructure/identity-repository',
  'modules/identity/application/identity-service.ts imports infrastructure through ../infrastructure/password-hasher',
]

function layerOf(file: string): string | undefined {
  const parts = path.relative(sourceRoot, file).split(path.sep)
  if (parts[0] === 'modules' && parts.length > 3 && layers.has(parts[2]!))
    return parts[2]
  return layers.has(parts[0]!) ? parts[0] : undefined
}

describe('module layer dependencies (ADR-020)', () => {
  it('assigns every module source file to a layer', async () => {
    const files = await collectSourceFiles(path.join(sourceRoot, 'modules'))
    expect(files.length).toBeGreaterThan(0)
    expect(
      files
        .filter((file) => !layerOf(file))
        .map((file) => path.relative(sourceRoot, file)),
    ).toEqual([])
  })

  it('keeps module imports within the approved direction', async () => {
    const files = await collectSourceFiles(path.join(sourceRoot, 'modules'))
    const violations: string[] = []
    const importPattern =
      /^\s*(?:import|export)\s+(?:type\s+)?(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/gm

    for (const file of files) {
      const sourceLayer = layerOf(file)!
      const forbiddenTargets = moduleForbiddenImports[sourceLayer]!
      const source = await readFile(file, 'utf8')
      for (const match of source.matchAll(importPattern)) {
        const specifier = match[1]!
        if (!specifier.startsWith('.')) continue
        const importedFile = await resolveSourceImport(file, specifier)
        if (!importedFile) continue
        const targetLayer = layerOf(importedFile)
        if (targetLayer && forbiddenTargets.includes(targetLayer))
          violations.push(
            `${path.relative(sourceRoot, file).split(path.sep).join('/')} imports ${targetLayer} through ${specifier}`,
          )
      }
    }

    expect(violations.sort()).toEqual([...registeredModuleViolations].sort())
  })
})

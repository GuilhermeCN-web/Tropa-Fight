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

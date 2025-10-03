#!/usr/bin/env node
import { access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { resolve } from 'node:path'

const requiredFonts = [
  'public/fonts/inter/InterVar.woff2',
  'public/fonts/inter/InterVarItalic.woff2',
  'public/fonts/fraunces/FrauncesVar.woff2',
]

const missing = []

for (const relativePath of requiredFonts) {
  const fullPath = resolve(relativePath)
  try {
    await access(fullPath, constants.R_OK)
  } catch (error) {
    missing.push({ relativePath, error })
  }
}

if (missing.length > 0) {
  console.error('\n❌ Missing font assets detected:')
  for (const entry of missing) {
    console.error(`  • ${entry.relativePath}`)
  }
  console.error('\nAdd the required .woff2 files before running the build.')
  process.exitCode = 1
} else {
  process.exitCode = 0
}

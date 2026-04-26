import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const cwd = process.cwd()
const host = '127.0.0.1'
const port = process.env.PLAYWRIGHT_PORT || '3100'
const localNpmWrapper = path.join(cwd, process.platform === 'win32' ? 'npmw.cmd' : 'npmw')
const npmCommand = fs.existsSync(localNpmWrapper)
  ? localNpmWrapper
  : process.platform === 'win32'
    ? 'npm.cmd'
    : 'npm'

function childEnv(extra = {}) {
  return Object.fromEntries(
    Object.entries({
      ...process.env,
      NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED || '1',
      ...extra,
    }).filter(([, value]) => value !== undefined),
  )
}

function newestMtimeMs(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return 0
  }

  const stats = fs.statSync(targetPath)
  if (!stats.isDirectory()) {
    return stats.mtimeMs
  }

  let newest = stats.mtimeMs
  for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next') {
      continue
    }

    newest = Math.max(newest, newestMtimeMs(path.join(targetPath, entry.name)))
  }

  return newest
}

function shouldBuild() {
  if (process.env.PLAYWRIGHT_SKIP_BUILD === '1') {
    return false
  }

  if (process.env.PLAYWRIGHT_FORCE_BUILD === '1') {
    return true
  }

  const buildIdPath = path.join(cwd, '.next', 'BUILD_ID')
  if (!fs.existsSync(buildIdPath)) {
    return true
  }

  const buildMtime = fs.statSync(buildIdPath).mtimeMs
  const sourcePaths = [
    'app',
    'src',
    'public',
    'next.config.ts',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
  ]

  return sourcePaths.some((sourcePath) => newestMtimeMs(path.join(cwd, sourcePath)) > buildMtime)
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: childEnv(),
      shell: process.platform === 'win32',
      stdio: 'inherit',
    })

    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${command} ${args.join(' ')} exited with ${signal || code}`))
    })
  })
}

if (shouldBuild()) {
  await runCommand(npmCommand, ['run', 'build'])
}

const server = spawn(npmCommand, ['run', 'start', '--', '--hostname', host, '--port', port], {
  cwd,
  env: childEnv({ PORT: port }),
  shell: process.platform === 'win32',
  stdio: 'inherit',
})

function shutdown() {
  if (!server.killed) {
    server.kill('SIGTERM')
  }
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
process.on('exit', shutdown)

server.on('exit', (code) => {
  process.exit(code ?? 0)
})

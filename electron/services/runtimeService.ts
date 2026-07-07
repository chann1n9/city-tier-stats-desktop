import { app } from 'electron'
import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export interface RunCityTierStatsOptions {
  groupBy?: boolean | string
  configPath?: string
}

export interface CityTierStatsResult {
  stdout: string
  stderr: string
  json: unknown
}

export function getCityTierStatsRuntimePath() {
  const executableName = process.platform === 'win32'
    ? 'city-tier-stats.exe'
    : 'city-tier-stats'

  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'runtimes/city-tier-stats', executableName)
  }

  return path.join(process.env.APP_ROOT, 'resources/runtimes/city-tier-stats', executableName)
}

export async function runCityTierStats(
  filePath: string,
  options: RunCityTierStatsOptions = {},
): Promise<CityTierStatsResult> {
  const args = buildCityTierStatsArgs(filePath, options)
  const { stdout, stderr } = await execFileAsync(getCityTierStatsRuntimePath(), args, {
    maxBuffer: 64 * 1024 * 1024,
  })

  return {
    stdout,
    stderr,
    json: parseJsonOutput(stdout),
  }
}

export async function exportCityTierStatsDetailFromJson(jsonPath: string, outputPath: string) {
  await execFileAsync(getCityTierStatsRuntimePath(), [
    '--from-json',
    jsonPath,
    '--detail-output',
    outputPath,
  ], {
    maxBuffer: 64 * 1024 * 1024,
  })
}

export async function getCityTierStatsRuntimeVersion() {
  const { stdout } = await execFileAsync(getCityTierStatsRuntimePath(), ['--version'])
  const versionText = stdout.trim()
  const version = versionText.match(/\d+\.\d+\.\d+/)?.[0]

  return version ?? versionText
}

function buildCityTierStatsArgs(filePath: string, options: RunCityTierStatsOptions) {
  const args = [filePath]

  if (options.groupBy) {
    args.push('--group-by')

    if (typeof options.groupBy === 'string') {
      args.push(options.groupBy)
    }
  }

  if (options.configPath) {
    args.push('--config', options.configPath)
  }

  args.push('--json')

  return args
}

function parseJsonOutput(stdout: string) {
  try {
    return JSON.parse(stdout)
  } catch (error) {
    throw new Error(`city-tier-stats did not return valid JSON: ${(error as Error).message}`)
  }
}

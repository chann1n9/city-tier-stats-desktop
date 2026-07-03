import { app, shell } from 'electron'
import { parse, stringify } from 'yaml'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

export type CityTierCode = 'first' | 'new_first' | 'second' | 'third' | 'fourth'

export interface CityTierRules {
  tiers: Record<CityTierCode, string[]>
}

export interface ReloadRulesResult {
  path: string
  rules: CityTierRules
}

export interface MutateCityTierRuleInput {
  tier: CityTierCode
  city: string
}

export interface RemoveCityTierRuleInput {
  tier?: CityTierCode
  city: string
}

const rulesDirectoryName = 'rules'
const rulesFileName = 'city_tiers.yaml'
const tierCodes: CityTierCode[] = ['first', 'new_first', 'second', 'third', 'fourth']

let cachedRules: CityTierRules | null = null

export function getDefaultRulesPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'runtimes/city-tier-stats/city_tiers.yaml')
  }

  return path.join(process.env.APP_ROOT, 'resources/runtimes/city-tier-stats/city_tiers.yaml')
}

export function getUserRulesPath() {
  return path.join(app.getPath('userData'), rulesDirectoryName, rulesFileName)
}

export async function ensureUserRulesFile() {
  const userRulesPath = getUserRulesPath()

  try {
    await readFile(userRulesPath, 'utf8')
  } catch {
    await copyDefaultRulesToUserRules()
  }

  return userRulesPath
}

export async function reloadRules(): Promise<ReloadRulesResult> {
  const userRulesPath = await ensureUserRulesFile()
  const rulesYaml = await readFile(userRulesPath, 'utf8')
  const rules = assertCityTierRules(parse(rulesYaml))

  cachedRules = rules

  return {
    path: userRulesPath,
    rules,
  }
}

export async function resetRulesToDefault() {
  await copyDefaultRulesToUserRules()
  return reloadRules()
}

export async function addCityToTier(input: MutateCityTierRuleInput) {
  const city = normalizeRuleCity(input.city)
  assertTierCode(input.tier)
  assertRuleCity(city)

  const rules = await readUserRules()

  for (const tierCode of tierCodes) {
    rules.tiers[tierCode] = rules.tiers[tierCode].filter((item) => item !== city)
  }

  rules.tiers[input.tier].push(city)

  await writeUserRules(rules)
  return reloadRules()
}

export async function removeCityFromTier(input: MutateCityTierRuleInput) {
  const city = normalizeRuleCity(input.city)
  assertTierCode(input.tier)
  assertRuleCity(city)

  const rules = await readUserRules()
  rules.tiers[input.tier] = rules.tiers[input.tier].filter((item) => item !== city)

  await writeUserRules(rules)
  return reloadRules()
}

export async function removeCityFromRules(input: RemoveCityTierRuleInput) {
  if (input.tier) {
    return removeCityFromTier({
      tier: input.tier,
      city: input.city,
    })
  }

  const city = normalizeRuleCity(input.city)
  assertRuleCity(city)

  const rules = await readUserRules()

  for (const tierCode of tierCodes) {
    rules.tiers[tierCode] = rules.tiers[tierCode].filter((item) => item !== city)
  }

  await writeUserRules(rules)
  return reloadRules()
}

export async function openRulesFile() {
  const userRulesPath = await ensureUserRulesFile()
  const errorMessage = await shell.openPath(userRulesPath)

  if (errorMessage) {
    throw new Error(errorMessage)
  }

  return userRulesPath
}

export async function openRulesDirectory() {
  const userRulesPath = await ensureUserRulesFile()
  const rulesDirectoryPath = path.dirname(userRulesPath)
  const errorMessage = await shell.openPath(rulesDirectoryPath)

  if (errorMessage) {
    throw new Error(errorMessage)
  }

  return rulesDirectoryPath
}

export function getCachedRules() {
  return cachedRules
}

async function copyDefaultRulesToUserRules() {
  const userRulesPath = getUserRulesPath()

  await mkdir(path.dirname(userRulesPath), { recursive: true })
  await copyFile(getDefaultRulesPath(), userRulesPath)

  return userRulesPath
}

async function readUserRules() {
  const userRulesPath = await ensureUserRulesFile()
  const rulesYaml = await readFile(userRulesPath, 'utf8')

  return assertCityTierRules(parse(rulesYaml))
}

async function writeUserRules(rules: CityTierRules) {
  const userRulesPath = await ensureUserRulesFile()
  await writeFile(userRulesPath, stringify(rules), 'utf8')
}

function assertCityTierRules(value: unknown): CityTierRules {
  if (!isObject(value) || !isObject(value.tiers)) {
    throw new Error('city tier rules must contain a tiers object')
  }

  const tiers = value.tiers
  const seenCities = new Map<string, CityTierCode>()

  for (const tierCode of tierCodes) {
    if (!Array.isArray(tiers[tierCode])) {
      throw new Error(`city tier rules must contain tiers.${tierCode} as a list`)
    }

    for (const city of tiers[tierCode]) {
      if (typeof city !== 'string') {
        throw new Error(`city tier rules tiers.${tierCode} must contain only strings`)
      }

      const normalizedCity = normalizeRuleCity(city)
      assertRuleCity(normalizedCity)

      const existingTier = seenCities.get(normalizedCity)

      if (existingTier) {
        throw new Error(`city "${normalizedCity}" appears in both tiers.${existingTier} and tiers.${tierCode}`)
      }

      seenCities.set(normalizedCity, tierCode)
    }
  }

  return {
    tiers: Object.fromEntries(
      tierCodes.map((tierCode) => [tierCode, tiers[tierCode] as string[]]),
    ) as Record<CityTierCode, string[]>,
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeRuleCity(city: string) {
  return city.trim().replace(/\s+/g, '')
}

function assertRuleCity(city: string) {
  if (!city) {
    throw new Error('city is required')
  }
}

function assertTierCode(tier: string): asserts tier is CityTierCode {
  if (!tierCodes.includes(tier as CityTierCode)) {
    throw new Error(`invalid tier: ${tier}`)
  }
}

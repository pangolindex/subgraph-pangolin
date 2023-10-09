/* eslint-disable prefer-const */
import { log, BigInt } from '@graphprotocol/graph-ts'
import { Factory, Pool, Token, Bundle } from '../../generated/schema'
import { PoolCreated } from '../../generated/Factory/Factory'
import { Pool as PoolTemplate } from '../../generated/templates'
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from './token'
import { WHITELIST_TOKENS } from './pricing.output'
import { FACTORY_ADDRESS } from './constants.output'
import { ADDRESS_ZERO, BI_0, BI_1, BD_0 } from '../constants'

export function handlePoolCreated(event: PoolCreated): void {
  // temp fix
  // if (event.params.pool == Address.fromHexString('0x8fe8d9bb8eeba3ed688069c3d6b556c9ca258248')) {
  //   return
  // }

  // load factory
  let factory = Factory.load(FACTORY_ADDRESS)
  if (factory === null) {
    factory = new Factory(FACTORY_ADDRESS)
    factory.poolCount = BI_0
    factory.totalVolumeETH = BD_0
    factory.totalVolumeUSD = BD_0
    factory.untrackedVolumeUSD = BD_0
    factory.totalFeesUSD = BD_0
    factory.totalFeesETH = BD_0
    factory.totalValueLockedETH = BD_0
    factory.totalValueLockedUSD = BD_0
    factory.totalValueLockedUSDUntracked = BD_0
    factory.totalValueLockedETHUntracked = BD_0
    factory.txCount = BI_0
    factory.owner = ADDRESS_ZERO

    // create new bundle for tracking eth price
    let bundle = new Bundle('1')
    bundle.ethPriceUSD = BD_0
    bundle.save()
  }

  factory.poolCount = factory.poolCount.plus(BI_1)

  let pool = new Pool(event.params.pool.toHexString()) as Pool
  let token0 = Token.load(event.params.token0.toHexString())
  let token1 = Token.load(event.params.token1.toHexString())

  // fetch info if null
  if (token0 === null) {
    token0 = new Token(event.params.token0.toHexString())
    token0.symbol = fetchTokenSymbol(event.params.token0)
    token0.name = fetchTokenName(event.params.token0)
    let decimals = fetchTokenDecimals(event.params.token0)

    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      log.debug('mybug the decimal on token 0 was null', [])
      return
    }

    token0.decimals = decimals
    token0.derivedETH = BD_0
    token0.volume = BD_0
    token0.volumeUSD = BD_0
    token0.feesUSD = BD_0
    token0.untrackedVolumeUSD = BD_0
    token0.totalValueLocked = BD_0
    token0.totalValueLockedUSD = BD_0
    token0.totalValueLockedUSDUntracked = BD_0
    token0.txCount = BI_0
    token0.poolCount = BI_0
    token0.whitelistPools = []
  }

  if (token1 === null) {
    token1 = new Token(event.params.token1.toHexString())
    token1.symbol = fetchTokenSymbol(event.params.token1)
    token1.name = fetchTokenName(event.params.token1)
    let decimals = fetchTokenDecimals(event.params.token1)
    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      log.debug('mybug the decimal on token 0 was null', [])
      return
    }
    token1.decimals = decimals
    token1.derivedETH = BD_0
    token1.volume = BD_0
    token1.volumeUSD = BD_0
    token1.untrackedVolumeUSD = BD_0
    token1.feesUSD = BD_0
    token1.totalValueLocked = BD_0
    token1.totalValueLockedUSD = BD_0
    token1.totalValueLockedUSDUntracked = BD_0
    token1.txCount = BI_0
    token1.poolCount = BI_0
    token1.whitelistPools = []
  }

  // update white listed pools
  if (WHITELIST_TOKENS.includes(token0.id)) {
    let newPools = token1.whitelistPools
    newPools.push(pool.id)
    token1.whitelistPools = newPools
  }
  if (WHITELIST_TOKENS.includes(token1.id)) {
    let newPools = token0.whitelistPools
    newPools.push(pool.id)
    token0.whitelistPools = newPools
  }

  pool.token0 = token0.id
  pool.token1 = token1.id
  pool.feeTier = BigInt.fromI32(event.params.fee)
  pool.createdAtTimestamp = event.block.timestamp
  pool.createdAtBlockNumber = event.block.number
  pool.liquidityProviderCount = BI_0
  pool.txCount = BI_0
  pool.liquidity = BI_0
  pool.sqrtPrice = BI_0
  pool.feeGrowthGlobal0X128 = BI_0
  pool.feeGrowthGlobal1X128 = BI_0
  pool.token0Price = BD_0
  pool.token1Price = BD_0
  pool.observationIndex = BI_0
  pool.totalValueLockedToken0 = BD_0
  pool.totalValueLockedToken1 = BD_0
  pool.totalValueLockedUSD = BD_0
  pool.totalValueLockedETH = BD_0
  pool.totalValueLockedUSDUntracked = BD_0
  pool.volumeToken0 = BD_0
  pool.volumeToken1 = BD_0
  pool.volumeUSD = BD_0
  pool.feesUSD = BD_0
  pool.untrackedVolumeUSD = BD_0

  pool.collectedFeesToken0 = BD_0
  pool.collectedFeesToken1 = BD_0
  pool.collectedFeesUSD = BD_0

  pool.save()
  // create the tracked contract based on the template
  PoolTemplate.create(event.params.pool)
  token0.save()
  token1.save()
  factory.save()
}

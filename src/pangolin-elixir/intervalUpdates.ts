/* eslint-disable prefer-const */
import { ethereum } from '@graphprotocol/graph-ts'
import {
  PangolinDayData,
  Factory,
  Pool,
  PoolDayData,
  Token,
  TokenDayData,
  TokenHourData,
  Bundle,
  PoolHourData,
  TickDayData,
  Tick
} from '../../generated/schema'
import { FACTORY_ADDRESS } from './constants.output'
import { BD_0, BI_0, BI_1 } from '../constants'


/**
 * Tracks global aggregate data over daily windows
 * @param event
 */
export function updatePangolinDayData(event: ethereum.Event): PangolinDayData {
  let factory = Factory.load(FACTORY_ADDRESS)!
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400 // rounded
  let dayStartTimestamp = dayID * 86400
  let pangolinDayData = PangolinDayData.load(dayID.toString())
  if (pangolinDayData === null) {
    pangolinDayData = new PangolinDayData(dayID.toString())
    pangolinDayData.date = dayStartTimestamp
    pangolinDayData.volumeETH = BD_0
    pangolinDayData.volumeUSD = BD_0
    pangolinDayData.volumeUSDUntracked = BD_0
    pangolinDayData.feesUSD = BD_0
  }
  pangolinDayData.tvlUSD = factory.totalValueLockedUSD
  pangolinDayData.txCount = factory.txCount
  pangolinDayData.save()
  return pangolinDayData as PangolinDayData
}

export function updatePoolDayData(event: ethereum.Event): PoolDayData {
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let dayPoolID = event.address
    .toHexString()
    .concat('-')
    .concat(dayID.toString())
  let pool = Pool.load(event.address.toHexString())!
  let poolDayData = PoolDayData.load(dayPoolID)
  if (poolDayData === null) {
    poolDayData = new PoolDayData(dayPoolID)
    poolDayData.date = dayStartTimestamp
    poolDayData.pool = pool.id
    // things that dont get initialized always
    poolDayData.volumeToken0 = BD_0
    poolDayData.volumeToken1 = BD_0
    poolDayData.volumeUSD = BD_0
    poolDayData.feesUSD = BD_0
    poolDayData.txCount = BI_0
    poolDayData.feeGrowthGlobal0X128 = BI_0
    poolDayData.feeGrowthGlobal1X128 = BI_0
    poolDayData.open = pool.token0Price
    poolDayData.high = pool.token0Price
    poolDayData.low = pool.token0Price
    poolDayData.close = pool.token0Price
  }

  if (pool.token0Price.gt(poolDayData.high)) {
    poolDayData.high = pool.token0Price
  }
  if (pool.token0Price.lt(poolDayData.low)) {
    poolDayData.low = pool.token0Price
  }

  poolDayData.liquidity = pool.liquidity
  poolDayData.sqrtPrice = pool.sqrtPrice
  poolDayData.feeGrowthGlobal0X128 = pool.feeGrowthGlobal0X128
  poolDayData.feeGrowthGlobal1X128 = pool.feeGrowthGlobal1X128
  poolDayData.token0Price = pool.token0Price
  poolDayData.token1Price = pool.token1Price
  poolDayData.tick = pool.tick
  poolDayData.tvlUSD = pool.totalValueLockedUSD
  poolDayData.txCount = poolDayData.txCount.plus(BI_1)
  poolDayData.save()

  return poolDayData as PoolDayData
}

export function updatePoolHourData(event: ethereum.Event): PoolHourData {
  let timestamp = event.block.timestamp.toI32()
  let hourIndex = timestamp / 3600 // get unique hour within unix history
  let hourStartUnix = hourIndex * 3600 // want the rounded effect
  let hourPoolID = event.address
    .toHexString()
    .concat('-')
    .concat(hourIndex.toString())
  let pool = Pool.load(event.address.toHexString())!
  let poolHourData = PoolHourData.load(hourPoolID)
  if (poolHourData === null) {
    poolHourData = new PoolHourData(hourPoolID)
    poolHourData.periodStartUnix = hourStartUnix
    poolHourData.pool = pool.id
    // things that dont get initialized always
    poolHourData.volumeToken0 = BD_0
    poolHourData.volumeToken1 = BD_0
    poolHourData.volumeUSD = BD_0
    poolHourData.txCount = BI_0
    poolHourData.feesUSD = BD_0
    poolHourData.feeGrowthGlobal0X128 = BI_0
    poolHourData.feeGrowthGlobal1X128 = BI_0
    poolHourData.open = pool.token0Price
    poolHourData.high = pool.token0Price
    poolHourData.low = pool.token0Price
    poolHourData.close = pool.token0Price
  }

  if (pool.token0Price.gt(poolHourData.high)) {
    poolHourData.high = pool.token0Price
  }
  if (pool.token0Price.lt(poolHourData.low)) {
    poolHourData.low = pool.token0Price
  }

  poolHourData.liquidity = pool.liquidity
  poolHourData.sqrtPrice = pool.sqrtPrice
  poolHourData.token0Price = pool.token0Price
  poolHourData.token1Price = pool.token1Price
  poolHourData.feeGrowthGlobal0X128 = pool.feeGrowthGlobal0X128
  poolHourData.feeGrowthGlobal1X128 = pool.feeGrowthGlobal1X128
  poolHourData.close = pool.token0Price
  poolHourData.tick = pool.tick
  poolHourData.tvlUSD = pool.totalValueLockedUSD
  poolHourData.txCount = poolHourData.txCount.plus(BI_1)
  poolHourData.save()

  // test
  return poolHourData as PoolHourData
}

export function updateTokenDayData(token: Token, event: ethereum.Event): TokenDayData {
  let bundle = Bundle.load('1')!
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let tokenDayID = token.id
    .toString()
    .concat('-')
    .concat(dayID.toString())
  let tokenPrice = token.derivedETH.times(bundle.ethPriceUSD)

  let tokenDayData = TokenDayData.load(tokenDayID)
  if (tokenDayData === null) {
    tokenDayData = new TokenDayData(tokenDayID)
    tokenDayData.date = dayStartTimestamp
    tokenDayData.token = token.id
    tokenDayData.volume = BD_0
    tokenDayData.volumeUSD = BD_0
    tokenDayData.feesUSD = BD_0
    tokenDayData.untrackedVolumeUSD = BD_0
    tokenDayData.open = tokenPrice
    tokenDayData.high = tokenPrice
    tokenDayData.low = tokenPrice
    tokenDayData.close = tokenPrice
  }

  if (tokenPrice.gt(tokenDayData.high)) {
    tokenDayData.high = tokenPrice
  }

  if (tokenPrice.lt(tokenDayData.low)) {
    tokenDayData.low = tokenPrice
  }

  tokenDayData.close = tokenPrice
  tokenDayData.priceUSD = token.derivedETH.times(bundle.ethPriceUSD)
  tokenDayData.totalValueLocked = token.totalValueLocked
  tokenDayData.totalValueLockedUSD = token.totalValueLockedUSD
  tokenDayData.save()

  return tokenDayData as TokenDayData
}

export function updateTokenHourData(token: Token, event: ethereum.Event): TokenHourData {
  let bundle = Bundle.load('1')!
  let timestamp = event.block.timestamp.toI32()
  let hourIndex = timestamp / 3600 // get unique hour within unix history
  let hourStartUnix = hourIndex * 3600 // want the rounded effect
  let tokenHourID = token.id
    .toString()
    .concat('-')
    .concat(hourIndex.toString())
  let tokenHourData = TokenHourData.load(tokenHourID)
  let tokenPrice = token.derivedETH.times(bundle.ethPriceUSD)

  if (tokenHourData === null) {
    tokenHourData = new TokenHourData(tokenHourID)
    tokenHourData.periodStartUnix = hourStartUnix
    tokenHourData.token = token.id
    tokenHourData.volume = BD_0
    tokenHourData.volumeUSD = BD_0
    tokenHourData.untrackedVolumeUSD = BD_0
    tokenHourData.feesUSD = BD_0
    tokenHourData.open = tokenPrice
    tokenHourData.high = tokenPrice
    tokenHourData.low = tokenPrice
    tokenHourData.close = tokenPrice
  }

  if (tokenPrice.gt(tokenHourData.high)) {
    tokenHourData.high = tokenPrice
  }

  if (tokenPrice.lt(tokenHourData.low)) {
    tokenHourData.low = tokenPrice
  }

  tokenHourData.close = tokenPrice
  tokenHourData.priceUSD = tokenPrice
  tokenHourData.totalValueLocked = token.totalValueLocked
  tokenHourData.totalValueLockedUSD = token.totalValueLockedUSD
  tokenHourData.save()

  return tokenHourData as TokenHourData
}

export function updateTickDayData(tick: Tick, event: ethereum.Event): TickDayData {
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let tickDayDataID = tick.id.concat('-').concat(dayID.toString())
  let tickDayData = TickDayData.load(tickDayDataID)
  if (tickDayData === null) {
    tickDayData = new TickDayData(tickDayDataID)
    tickDayData.date = dayStartTimestamp
    tickDayData.pool = tick.pool
    tickDayData.tick = tick.id
  }
  tickDayData.liquidityGross = tick.liquidityGross
  tickDayData.liquidityNet = tick.liquidityNet
  tickDayData.volumeToken0 = tick.volumeToken0
  tickDayData.volumeToken1 = tick.volumeToken0
  tickDayData.volumeUSD = tick.volumeUSD
  tickDayData.feesUSD = tick.feesUSD
  tickDayData.feeGrowthOutside0X128 = tick.feeGrowthOutside0X128
  tickDayData.feeGrowthOutside1X128 = tick.feeGrowthOutside1X128

  tickDayData.save()

  return tickDayData as TickDayData
}

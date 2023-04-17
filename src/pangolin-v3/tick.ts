/* eslint-disable prefer-const */
import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { bigDecimalExponated, safeDiv } from './index'
import { Tick } from '../../generated/schema'
import { Mint as MintEvent } from '../../generated/templates/Pool/Pool'
import { BD_1, BD_0, BI_0 } from '../constants'

export function createTick(tickId: string, tickIdx: i32, poolId: string, event: MintEvent): Tick {
  let tick = new Tick(tickId)
  tick.tickIdx = BigInt.fromI32(tickIdx)
  tick.pool = poolId
  tick.poolAddress = poolId

  tick.createdAtTimestamp = event.block.timestamp
  tick.createdAtBlockNumber = event.block.number
  tick.liquidityGross = BI_0
  tick.liquidityNet = BI_0
  tick.liquidityProviderCount = BI_0

  tick.price0 = BD_1
  tick.price1 = BD_1

  // 1.0001^tick is token1/token0.
  let price0 = bigDecimalExponated(BigDecimal.fromString('1.0001'), BigInt.fromI32(tickIdx))
  tick.price0 = price0
  tick.price1 = safeDiv(BD_1, price0)

  tick.volumeToken0 = BD_0
  tick.volumeToken1 = BD_0
  tick.volumeUSD = BD_0
  tick.feesUSD = BD_0
  tick.untrackedVolumeUSD = BD_0
  tick.collectedFeesToken0 = BD_0
  tick.collectedFeesToken1 = BD_0
  tick.collectedFeesUSD = BD_0
  tick.liquidityProviderCount = BI_0
  tick.feeGrowthOutside0X128 = BI_0
  tick.feeGrowthOutside1X128 = BI_0

  return tick
}

export function feeTierToTickSpacing(feeTier: BigInt): BigInt {
  if (feeTier.equals(BigInt.fromI32(10000))) {
    return BigInt.fromI32(200)
  }
  if (feeTier.equals(BigInt.fromI32(3000))) {
    return BigInt.fromI32(60)
  }
  if (feeTier.equals(BigInt.fromI32(500))) {
    return BigInt.fromI32(10)
  }
  if (feeTier.equals(BigInt.fromI32(100))) {
    return BigInt.fromI32(1)
  }

  throw Error('Unexpected fee tier')
}

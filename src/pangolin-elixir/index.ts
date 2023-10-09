/* eslint-disable prefer-const */
import { BigInt, BigDecimal, ethereum } from '@graphprotocol/graph-ts'
import { Transaction } from '../../generated/schema'
import { BD_0, BD_1, BI_18, BI_1, BI_0 } from '../constants'

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = BI_0; i.lt(decimals as BigInt); i = i.plus(BI_1)) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}

// return 0 if denominator is 0 in division
export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(BD_0)) {
    return BD_0
  } else {
    return amount0.div(amount1)
  }
}

export function bigDecimalExponated(value: BigDecimal, power: BigInt): BigDecimal {
  if (power.equals(BI_0)) {
    return BD_1
  }
  let negativePower = power.lt(BI_0)
  let result = BD_0.plus(value)
  let powerAbs = power.abs()
  for (let i = BI_1; i.lt(powerAbs); i = i.plus(BI_1)) {
    result = result.times(value)
  }

  if (negativePower) {
    result = safeDiv(BD_1, result)
  }

  return result
}

export function tokenAmountToDecimal(tokenAmount: BigInt, exchangeDecimals: BigInt): BigDecimal {
  if (exchangeDecimals == BI_0) {
    return tokenAmount.toBigDecimal()
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals))
}

export function priceToDecimal(amount: BigDecimal, exchangeDecimals: BigInt): BigDecimal {
  if (exchangeDecimals == BI_0) {
    return amount
  }
  return safeDiv(amount, exponentToBigDecimal(exchangeDecimals))
}

export function equalToZero(value: BigDecimal): boolean {
  const formattedVal = parseFloat(value.toString())
  const zero = parseFloat(BD_0.toString())
  if (zero == formattedVal) {
    return true
  }
  return false
}

export function isNullEthValue(value: string): boolean {
  return value == '0x0000000000000000000000000000000000000000000000000000000000000001'
}

export function bigDecimalExp18(): BigDecimal {
  return BigDecimal.fromString('1000000000000000000')
}

export function convertTokenToDecimal(tokenAmount: BigInt, exchangeDecimals: BigInt): BigDecimal {
  if (exchangeDecimals == BI_0) {
    return tokenAmount.toBigDecimal()
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals))
}

export function convertEthToDecimal(eth: BigInt): BigDecimal {
  return eth.toBigDecimal().div(exponentToBigDecimal(BI_18))
}

export function loadTransaction(event: ethereum.Event): Transaction {
  let transaction = Transaction.load(event.transaction.hash.toHexString())
  if (transaction === null) {
    transaction = new Transaction(event.transaction.hash.toHexString())
  }
  transaction.blockNumber = event.block.number
  transaction.timestamp = event.block.timestamp
  transaction.save()
  return transaction as Transaction
}

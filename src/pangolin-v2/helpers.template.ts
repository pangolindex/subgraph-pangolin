/* Generated from mustache template for network: {{network}} */
/* eslint-disable prefer-const */
import {BigInt, BigDecimal, Address} from '@graphprotocol/graph-ts'
import {ERC20} from '../../generated/Factory/ERC20'
import {ERC20SymbolBytes} from '../../generated/Factory/ERC20SymbolBytes'
import {ERC20NameBytes} from '../../generated/Factory/ERC20NameBytes'
import {BI_0, BI_1, BD_1, BD_10} from '../constants'

export const ROUTER_ADDRESS = '{{Router}}'
export const WETH_ADDRESS = '{{WETH}}'
export const PNG_ADDRESS = '{{PNG}}'
export let BI_MINIMUM_LIQUIDITY = BigInt.fromI32(1000)

export let STAKING_DESTINATIONS: string[] = [
    {{#MiniChefV2}}
    '{{address}}', /* MiniChefV2 */
    {{/MiniChefV2}}
    {{#PangoChef}}
    '{{address}}', /* PangoChef */
    {{/PangoChef}}
]

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
    let bd = BD_1
    for (let i = BI_0; i.lt(decimals as BigInt); i = i.plus(BI_1)) {
        bd = bd.times(BD_10)
    }
    return bd
}

export function convertTokenToDecimal(
    tokenAmount: BigInt,
    exchangeDecimals: BigInt
): BigDecimal {
    if (exchangeDecimals == BI_0) {
        return tokenAmount.toBigDecimal()
    }
    return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals))
}

export function isNullEthValue(value: string): boolean {
    return (
        value ==
        '0x0000000000000000000000000000000000000000000000000000000000000001'
    )
}

export function _fetchTokenSymbol(tokenAddress: Address): string {
    // Overrides
    {{#StaticTokens}}
    if (tokenAddress.toHexString() == '{{address}}') return '{{symbol}}'
    {{/StaticTokens}}

    let contract = ERC20.bind(tokenAddress)
    let contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress)

    // try types string and bytes32 for symbol
    let symbolValue = 'unknown'
    let symbolResult = contract.try_symbol()
    if (symbolResult.reverted) {
        let symbolResultBytes = contractSymbolBytes.try_symbol()
        if (!symbolResultBytes.reverted) {
            // for broken pairs that have no symbol function exposed
            if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
                symbolValue = symbolResultBytes.value.toString()
            }
        }
    } else {
        symbolValue = symbolResult.value
    }

    return symbolValue
}

export function _fetchTokenName(tokenAddress: Address): string {
    // Overrides
    {{#StaticTokens}}
    if (tokenAddress.toHexString() == '{{address}}') return '{{name}}'
    {{/StaticTokens}}

    let contract = ERC20.bind(tokenAddress)
    let contractNameBytes = ERC20NameBytes.bind(tokenAddress)

    // try types string and bytes32 for name
    let nameValue = 'unknown'
    let nameResult = contract.try_name()
    if (nameResult.reverted) {
        let nameResultBytes = contractNameBytes.try_name()
        if (!nameResultBytes.reverted) {
            // for broken exchanges that have no name function exposed
            if (!isNullEthValue(nameResultBytes.value.toHexString())) {
                nameValue = nameResultBytes.value.toString()
            }
        }
    } else {
        nameValue = nameResult.value
    }

    return nameValue
}

export function _fetchTokenDecimals(tokenAddress: Address): BigInt | null {
    // Overrides
    {{#StaticTokens}}
    if (tokenAddress.toHexString() == '{{address}}') return BigInt.fromI32({{decimals}}) // {{symbol}}
    {{/StaticTokens}}

    let contract = ERC20.bind(tokenAddress)
    // try types uint8 for decimals
    let decimalResult = contract.try_decimals()
    if (decimalResult.reverted) {
        return null
    } else {
        return BigInt.fromI32(decimalResult.value)
    }
}

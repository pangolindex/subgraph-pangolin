/* Generated from mustache template for network: {{network}} */
import {Address, BigInt, log} from '@graphprotocol/graph-ts'
import {BI_0} from '../constants'

// Iterated 'TrackedAccounts' from config
export const TRACKED_ACCOUNTS: string[] = [
    {{#TrackedAccounts}}
    '{{.}}',
    {{/TrackedAccounts}}
]

export function getTokenSymbol(tokenAddress: Address): string {
    // Iterated 'TrackedTokens' from config
    {{#TrackedTokens}}
    if (tokenAddress.toHexString() == '{{address}}') return '{{symbol}}'
    {{/TrackedTokens}}

    log.warning('Missing token symbol for {}', [tokenAddress.toHexString()])
    return 'UNKNOWN'
}

export function getTokenName(tokenAddress: Address): string {
    // Iterated 'TrackedTokens' from config
    {{#TrackedTokens}}
    if (tokenAddress.toHexString() == '{{address}}') return '{{name}}'
    {{/TrackedTokens}}

    log.warning('Missing token name for {}', [tokenAddress.toHexString()])
    return 'UNKNOWN'
}

export function getTokenDecimals(tokenAddress: Address): BigInt {
    // Iterated 'TrackedTokens' from config
    {{#TrackedTokens}}
    if (tokenAddress.toHexString() == '{{address}}') return BigInt.fromI32({{decimals}}) // {{symbol}}
    {{/TrackedTokens}}

    log.warning('Missing token decimals for {}', [tokenAddress.toHexString()])
    return BI_0
}
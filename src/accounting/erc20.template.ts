/* Generated from mustache template for network: {{network}} */
import {Token, TokenTransfer} from '../../generated/schema'
import {Transfer} from '../../generated/{{TrackedTokens.0.symbol}}/ERC20'
import {TRACKED_ACCOUNTS, getTokenSymbol, getTokenName, getTokenDecimals} from './helpers.output'

export function handleTransfer(event: Transfer): void {
    const from = event.params.from
    const to = event.params.to
    const value = event.params.value

    const isFromTrackedAccount = TRACKED_ACCOUNTS.includes(from.toHexString())
    const isToTrackedAccount = TRACKED_ACCOUNTS.includes(to.toHexString())

    // Short circuit for transfers between non-tracked accounts
    if (!isFromTrackedAccount && !isToTrackedAccount) return

    let token = Token.load(event.address)
    if (token == null) {
        token = new Token(event.address)
        token.symbol = getTokenSymbol(event.address)
        token.name = getTokenName(event.address)
        token.decimals = getTokenDecimals(event.address)
        token.save()
    }

    const tokenTransfer = new TokenTransfer(event.transaction.hash.toHexString() + '-' + event.logIndex.toString())
    tokenTransfer.token = token.id
    tokenTransfer.from = from
    tokenTransfer.to = to
    tokenTransfer.amount = value
    tokenTransfer.hash = event.transaction.hash
    tokenTransfer.timestamp = event.block.timestamp
    tokenTransfer.save()
}


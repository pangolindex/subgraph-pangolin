/* eslint-disable prefer-const */
import { BigInt, Address } from '@graphprotocol/graph-ts'
import { Factory as FactoryContract } from '../../generated/Factory/Factory'

export const FACTORY_ADDRESS = '{{Factory.address}}'
export let factoryContract = FactoryContract.bind(Address.fromString(FACTORY_ADDRESS))

// Initialize a Token Definition with the attributes
export class StaticTokenDefinition {
    address : Address
    symbol: string
    name: string
    decimals: BigInt

    // Initialize a Token Definition with its attributes
    constructor(address: Address, symbol: string, name: string, decimals: BigInt) {
        this.address = address
        this.symbol = symbol
        this.name = name
        this.decimals = decimals
    }

    // Get all tokens with a static definition
    static getStaticDefinitions(): Array<StaticTokenDefinition> {
        let staticDefinitions = new Array<StaticTokenDefinition>()

        {{#StaticTokens}}
        staticDefinitions.push(new StaticTokenDefinition(
            Address.fromString('{{address}}'),
            '{{symbol}}',
            '{{name}}',
            BigInt.fromI32({{decimals}})
        ))
        {{/StaticTokens}}

        return staticDefinitions
    }

    // Helper for hardcoded tokens
    static fromAddress(tokenAddress: Address) : StaticTokenDefinition | null {
        let staticDefinitions = this.getStaticDefinitions()
        let tokenAddressHex = tokenAddress.toHexString()

        // Search the definition using the address
        for (let i = 0; i < staticDefinitions.length; i++) {
            let staticDefinition = staticDefinitions[i]
            if(staticDefinition.address.toHexString() == tokenAddressHex) {
                return staticDefinition
            }
        }

        // If not found, return null
        return null
    }
}

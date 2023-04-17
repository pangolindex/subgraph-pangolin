import {Address, BigInt} from '@graphprotocol/graph-ts'
import {Farm, FarmingPosition, FarmReward, FarmRewarder, PangoChef, Pair, Token, User} from '../../generated/schema'
import {
    PeriodDurationUpdated,
    PeriodEnded,
    PoolInitialized,
    RewardAdded,
    RewarderSet,
    Staked,
    WeightSet,
    Withdrawn,
} from '../../generated/PangoChef/PangoChef'
import {RewarderViaMultiplierForPangoChef} from '../../generated/PangoChef/RewarderViaMultiplierForPangoChef'
import {PNG_ADDRESS} from './helpers.output'
import {ADDRESS_ZERO, BD_0, BI_0, BI_1, BI_1000} from '../constants'

// Both of these values are hardcoded in PangoChef
let PANGO_CHEF_INITIAL_WEIGHT = BI_1000
let PANGO_CHEF_INITIAL_PERIOD_DURATION = BigInt.fromI32(86400)

export function handlePoolInitialized(event: PoolInitialized): void {
    const chefAddress = event.address
    const pid = event.params.poolId
    const rewarderAddress = Address.zero()

    const chefKey = chefAddress.toHexString()
    const farmKey = chefAddress.toHexString() + '-' + pid.toHexString()
    const rewarderKey = rewarderAddress.toHexString() + '-' + pid.toHexString()

    let chef = PangoChef.load(chefKey)

    // If chef is null, PangoChef is being constructed and is creating the zero pool (ETH-PNG)
    if (chef === null) {
        chef = new PangoChef(chefKey)
        chef.totalRewardAdded = BI_0
        chef.totalWeight = PANGO_CHEF_INITIAL_WEIGHT
        chef.rewardRate = BI_0
        chef.periodDuration = PANGO_CHEF_INITIAL_PERIOD_DURATION
        chef.periodFinish = BI_0
        chef.save()
    }

    const farm = new Farm(farmKey)
    farm.pid = pid
    farm.tokenOrRecipientAddress = event.params.tokenOrRecipient
    farm.weight = pid.isZero() ? PANGO_CHEF_INITIAL_WEIGHT : BI_0
    farm.balance = BI_0
    farm.sumOfEntryTimes = BI_0
    farm.rewarder = rewarderKey
    farm.chef = chefKey

    // Conditionally add Pair if the Farm recipient is a known pair
    const pairContractAddressHexString = event.params.tokenOrRecipient.toHexString()
    if (pairContractAddressHexString != ADDRESS_ZERO) {
        const nullablePair = Pair.load(pairContractAddressHexString)
        if (nullablePair != null) {
            farm.pair = nullablePair.id
        }
    }

    farm.save()

    createFarmRewarder(chefAddress, rewarderAddress, pid)
}

export function handleStaked(event: Staked): void {
    const chefAddress = event.address
    const farmKey = chefAddress.toHexString() + '-' + event.params.positionId.toHexString()
    const amount = event.params.amount

    createUser(event.params.userId)

    const userStakingPosition = createStakingPosition(
        chefAddress,
        event.params.userId,
        event.params.positionId
    )

    const oldBalance = userStakingPosition.balance
    const addedEntryTimes = event.block.timestamp.times(amount)

    const farm = Farm.load(farmKey)!
    farm.balance = farm.balance.plus(amount)
    farm.sumOfEntryTimes = farm.sumOfEntryTimes.plus(addedEntryTimes)
    farm.save()

    // userStakingPosition.previousValues = userStakingPosition.previousValues.plus(oldBalance.times(event.block.timestamp.minus(userStakingPosition.lastUpdate)))
    userStakingPosition.balance = oldBalance.plus(amount)
    userStakingPosition.sumOfEntryTimes = userStakingPosition.sumOfEntryTimes.plus(addedEntryTimes)
    userStakingPosition.lastUpdate = event.block.timestamp
    userStakingPosition.save()
}

export function handleWithdrawn(event: Withdrawn): void {
    const chefAddress = event.address
    const farmKey = chefAddress.toHexString() + '-' + event.params.positionId.toHexString()
    const amount = event.params.amount

    createUser(event.params.userId)

    const userStakingPosition = createStakingPosition(
        chefAddress,
        event.params.userId,
        event.params.positionId
    )

    const oldBalance = userStakingPosition.balance
    const remaining = oldBalance.minus(amount)
    const newEntryTimes = event.block.timestamp.times(remaining)

    const farm = Farm.load(farmKey)!
    farm.balance = farm.balance.minus(amount)
    farm.sumOfEntryTimes = farm.sumOfEntryTimes.plus(newEntryTimes).minus(userStakingPosition.sumOfEntryTimes)
    farm.save()

    userStakingPosition.balance = remaining
    userStakingPosition.sumOfEntryTimes = newEntryTimes
    userStakingPosition.lastUpdate = event.block.timestamp
    userStakingPosition.save()
}

export function handleRewarderSet(event: RewarderSet): void {
    const chefAddress = event.address
    const pid = event.params.poolId
    const rewarderAddress = event.params.rewarder
    const farmKey = chefAddress.toHexString() + '-' + pid.toHexString()
    const rewarderKey = rewarderAddress.toHexString() + '-' + pid.toHexString()

    const farm = Farm.load(farmKey)!
    farm.rewarder = rewarderKey
    farm.save()

    createFarmRewarder(chefAddress, rewarderAddress, pid)
}

export function handleWeightSet(event: WeightSet): void {
    const chefAddress = event.address
    const pid = event.params.poolId
    const newWeight = event.params.newWeight
    const farmKey = chefAddress.toHexString() + '-' + pid.toHexString()

    const farm = Farm.load(farmKey)!

    const chef = PangoChef.load(chefAddress.toHexString())!
    chef.totalWeight = chef.totalWeight.minus(farm.weight).plus(newWeight)
    chef.save()

    farm.weight = newWeight
    farm.save()
}

export function handlePeriodEnded(event: PeriodEnded): void {
    const chefAddress = event.address
    const blockTime = event.block.timestamp
    const chef = PangoChef.load(chefAddress.toHexString())!
    const leftover = (chef.periodFinish.minus(event.block.timestamp)).times(chef.rewardRate)
    chef.totalRewardAdded = chef.totalRewardAdded.minus(leftover)
    chef.periodFinish = blockTime
    chef.save()
}

export function handleRewardAdded(event: RewardAdded): void {
    const chefAddress = event.address
    const blockTime = event.block.timestamp
    const newReward = event.params.reward
    const chef = PangoChef.load(chefAddress.toHexString())!
    chef.totalRewardAdded = chef.totalRewardAdded.plus(newReward)
    if (blockTime.ge(chef.periodFinish)) {
        chef.rewardRate = newReward.div(chef.periodDuration)
    } else {
        const leftover = (chef.periodFinish.minus(event.block.timestamp)).times(chef.rewardRate)
        chef.rewardRate = (newReward.plus(leftover)).div(chef.periodDuration)
    }
    chef.periodFinish = blockTime.plus(chef.periodDuration)
    chef.save()
}

export function handlePeriodDurationUpdated(event: PeriodDurationUpdated): void {
    const chefAddress = event.address
    const newDuration = event.params.newDuration
    const chef = PangoChef.load(chefAddress.toHexString())!
    chef.periodDuration = newDuration
    chef.save()
}


/***********
 * Helpers *
 ***********/

function createUser(userAddress: Address): void {
    let user = User.load(userAddress.toHexString())
    if (user === null) {
        user = new User(userAddress.toHexString())
        user.usdSwapped = BD_0
        user.save()
    }
}

function createFarmRewarder(
    chefAddress: Address,
    rewarderAddress: Address,
    pid: BigInt
): void {
    const farmKey = chefAddress.toHexString() + '-' + pid.toHexString()
    const farmRewarderKey = rewarderAddress.toHexString() + '-' + pid.toHexString()

    let farmRewarder = FarmRewarder.load(farmRewarderKey)
    if (farmRewarder === null) {
        farmRewarder = new FarmRewarder(farmRewarderKey)
        farmRewarder.farm = farmKey
        farmRewarder.save()

        // Default PNG reward
        createFarmReward(rewarderAddress, pid, Address.fromString(PNG_ADDRESS), BI_1)

        if (rewarderAddress.toHexString() != ADDRESS_ZERO) {
            const rewardTokens = _fetchRewardTokens(rewarderAddress)
            const multipliers = _fetchRewardMultipliers(rewarderAddress)

            for (let i = 0; i < rewardTokens.length; ++i) {
                createFarmReward(rewarderAddress, pid, rewardTokens[i], multipliers[i])
            }
        }
    }
}

function createFarmReward(
    rewarderAddress: Address,
    pid: BigInt,
    rewardTokenAddress: Address,
    multiplier: BigInt
): void {
    const farmRewardKey = rewarderAddress.toHexString() + '-' + rewardTokenAddress.toHexString() + '-' + pid.toString()
    const rewarderKey = rewarderAddress.toHexString() + '-' + pid.toHexString()

    const farmReward = new FarmReward(farmRewardKey)
    farmReward.multiplier = multiplier
    farmReward.rewarder = rewarderKey
    farmReward.tokenAddress = rewardTokenAddress

    // Only add token if the subgraph has already indexed it via a PangolinPair
    const token = Token.load(rewardTokenAddress.toHexString())
    if (token !== null) {
        farmReward.token = token.id
    }

    farmReward.save()
}

function createStakingPosition(
    chefAddress: Address,
    userAddress: Address,
    pid: BigInt
): FarmingPosition {
    const farmingPositionKey = userAddress.toHexString() + '-' + pid.toHexString()

    let farmingPosition = FarmingPosition.load(farmingPositionKey)

    if (farmingPosition === null) {
        const farmKey = chefAddress.toHexString() + '-' + pid.toHexString()
        farmingPosition = new FarmingPosition(farmingPositionKey)
        farmingPosition.balance = BI_0
        farmingPosition.sumOfEntryTimes = BI_0
        farmingPosition.lastUpdate = BI_0
        farmingPosition.farm = farmKey
        farmingPosition.user = userAddress.toHexString()
        farmingPosition.save()
    }

    return farmingPosition
}

function _fetchRewardTokens(rewarderAddress: Address): Array<Address> {
    let contract = RewarderViaMultiplierForPangoChef.bind(rewarderAddress)
    let totalRewardTokenValue = [] as Array<Address>
    let totalRewardTokenResult = contract.try_getRewardTokens()

    if (!totalRewardTokenResult.reverted) {
        totalRewardTokenValue = totalRewardTokenResult.value
    }

    return totalRewardTokenValue
}

function _fetchRewardMultipliers(
    rewarderAddress: Address
): Array<BigInt> {
    let contract = RewarderViaMultiplierForPangoChef.bind(rewarderAddress)
    let totalRewardMultiplierValue = [] as Array<BigInt>
    let totalRewardMultiplierResult = contract.try_getRewardMultipliers()

    if (!totalRewardMultiplierResult.reverted) {
        totalRewardMultiplierValue = totalRewardMultiplierResult.value
    }

    return totalRewardMultiplierValue as Array<BigInt>
}
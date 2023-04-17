import {BigInt} from '@graphprotocol/graph-ts'
import {SingleSideStaking, StakingPosition} from '../../generated/schema'
import {
    Staked,
    Withdrawn,
    PeriodEnded,
    RewardAdded,
    PeriodDurationUpdated,
} from '../../generated/StakingPositions/PangolinStakingPositions'
import {BI_0} from '../constants'


// These values are hardcoded in PangolinStakingPositions
let PANGOLIN_STAKING_POSITIONS_INITIAL_PERIOD_DURATION = BigInt.fromI32(14 * 86400)
export function handleStaked(event: Staked): void {
    const singleSideStaking = getSingleSideStaking()
    const stakingPosition = getStakingPosition(event.params.positionId)

    const totalAmount = event.params.amount.plus(event.params.reward)
    const addedEntryTimes = event.block.timestamp.times(totalAmount)

    singleSideStaking.balance = singleSideStaking.balance.plus(totalAmount)
    singleSideStaking.sumOfEntryTimes = singleSideStaking.sumOfEntryTimes.plus(addedEntryTimes)
    singleSideStaking.lastUpdate = event.block.timestamp
    singleSideStaking.save()

    stakingPosition.balance = stakingPosition.balance.plus(totalAmount)
    stakingPosition.sumOfEntryTimes = stakingPosition.sumOfEntryTimes.plus(addedEntryTimes)
    stakingPosition.lastUpdate = event.block.timestamp
    stakingPosition.save()
}
export function handleWithdrawn(event: Withdrawn): void {
    const singleSideStaking = getSingleSideStaking()
    const stakingPosition = getStakingPosition(event.params.positionId)

    const remaining = stakingPosition.balance.minus(event.params.amount)
    const newEntryTimes = event.block.timestamp.times(remaining)

    singleSideStaking.balance = singleSideStaking.balance.minus(event.params.amount)
    singleSideStaking.sumOfEntryTimes = singleSideStaking.sumOfEntryTimes.plus(newEntryTimes).minus(stakingPosition.sumOfEntryTimes)
    singleSideStaking.lastUpdate = event.block.timestamp
    singleSideStaking.save()

    stakingPosition.balance = remaining
    stakingPosition.sumOfEntryTimes = newEntryTimes
    stakingPosition.lastUpdate = event.block.timestamp
    stakingPosition.lastDevaluation = event.block.timestamp
    stakingPosition.save()
}
export function handlePeriodEnded(event: PeriodEnded): void {
    const singleSideStaking = getSingleSideStaking()
    const leftover = (singleSideStaking.periodFinish.minus(event.block.timestamp)).times(singleSideStaking.rewardRate)
    singleSideStaking.totalRewardAdded = singleSideStaking.totalRewardAdded.minus(leftover)
    singleSideStaking.periodFinish = event.block.timestamp
    singleSideStaking.save()
}
export function handleRewardAdded(event: RewardAdded): void {
    const newReward = event.params.reward
    const singleSideStaking = getSingleSideStaking()
    singleSideStaking.totalRewardAdded = singleSideStaking.totalRewardAdded.plus(newReward)
    if (singleSideStaking.lastUpdate.ge(singleSideStaking.periodFinish)) {
        singleSideStaking.rewardRate = newReward.div(singleSideStaking.periodDuration)
    } else {
        const leftover = (singleSideStaking.periodFinish.minus(singleSideStaking.lastUpdate)).times(singleSideStaking.rewardRate)
        singleSideStaking.rewardRate = (newReward.plus(leftover)).div(singleSideStaking.periodDuration)
    }
    singleSideStaking.lastUpdate = event.block.timestamp
    singleSideStaking.periodFinish = event.block.timestamp.plus(singleSideStaking.periodDuration)
    singleSideStaking.save()
}
export function handlePeriodDurationUpdated(event: PeriodDurationUpdated): void {
    const singleSideStaking = getSingleSideStaking()
    singleSideStaking.periodDuration = event.params.newDuration
    singleSideStaking.save()
}


/***********
 * Helpers *
 ***********/
function getSingleSideStaking(): SingleSideStaking {
    let singleSideStaking = SingleSideStaking.load('1')

    if (singleSideStaking === null) {
        singleSideStaking = new SingleSideStaking('1')
        singleSideStaking.totalRewardAdded = BI_0
        singleSideStaking.rewardRate = BI_0
        singleSideStaking.periodDuration = PANGOLIN_STAKING_POSITIONS_INITIAL_PERIOD_DURATION
        singleSideStaking.periodFinish = BI_0
        singleSideStaking.balance = BI_0
        singleSideStaking.sumOfEntryTimes = BI_0
        singleSideStaking.lastUpdate = BI_0
        singleSideStaking.save()
    }

    return singleSideStaking
}
function getStakingPosition(
    positionId: BigInt
): StakingPosition {
    const stakingPositionKey = positionId.toHexString()

    let stakingPosition = StakingPosition.load(stakingPositionKey)

    if (stakingPosition === null) {
        stakingPosition = new StakingPosition(stakingPositionKey)
        stakingPosition.balance = BI_0
        stakingPosition.sumOfEntryTimes = BI_0
        stakingPosition.lastUpdate = BI_0
        stakingPosition.lastDevaluation = BI_0
        stakingPosition.save()
    }

    return stakingPosition
}
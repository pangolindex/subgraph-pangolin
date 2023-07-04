/* eslint-disable prefer-const */
import { BigInt, Address, log } from "@graphprotocol/graph-ts";
import {
  Farm,
  Minichef,
  Pair,
  Token,
  User,
  FarmingPosition,
  FarmRewarder,
  FarmReward,
} from "../../generated/schema";
import {
  Deposit,
  PoolAdded,
  Withdraw,
  EmergencyWithdraw,
  PoolSet,
  LogRewardPerSecond,
  LogRewardsExpiration,
} from "../../generated/MiniChefV2/MiniChefV2";
import { RewarderViaMultiplier } from "../../generated/MiniChefV2/RewarderViaMultiplier";
import { PNG_ADDRESS } from "./helpers.output";
import { ADDRESS_ZERO, BD_0, BI_0, BI_1 } from "../constants";

export function handlePoolAdded(event: PoolAdded): void {
  log.info(
    "handlePoolAdded==============event.address" + event.address.toString(),
    []
  );
  log.info(
    "handlePoolAdded==============event.params.pid" +
      event.params.pid.toString(),
    []
  );
  log.info(
    "handlePoolAdded==============event.params.lpToken" +
      event.params.lpToken.toString(),
    []
  );
  log.info(
    "handlePoolAdded==============event.params.rewarder" +
      event.params.rewarder.toString(),
    []
  );

  createFarm(
    event.address,
    event.params.pid,
    event.params.lpToken,
    event.params.rewarder,
    event.params.allocPoint
  );
}

export function handleDeposit(event: Deposit): void {
  let farmKey =
    event.address.toHexString() + "-" + event.params.pid.toHexString();

  let farm = Farm.load(farmKey)!;

  farm.balance = farm.balance.plus(event.params.amount);

  farm.save();

  // user stats
  createUser(event.params.to);

  let toUserStakingPosition = createStakingPosition(
    farm.pairAddress as Address,
    event.params.to,
    farmKey
  );
  toUserStakingPosition.stakedTokenBalance = toUserStakingPosition.stakedTokenBalance.plus(
    event.params.amount
  );
  toUserStakingPosition.save();
}

export function handleWithdraw(event: Withdraw): void {
  let farmKey =
    event.address.toHexString() + "-" + event.params.pid.toHexString();

  let farm = Farm.load(farmKey)!;

  farm.balance = farm.balance.minus(event.params.amount);

  farm.save();

  // user stats
  createUser(event.params.to);

  let fromUserStakingPosition = createStakingPosition(
    farm.pairAddress as Address,
    event.params.user,
    farmKey
  );
  fromUserStakingPosition.stakedTokenBalance = fromUserStakingPosition.stakedTokenBalance.minus(
    event.params.amount
  );
  fromUserStakingPosition.save();
}

export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  let farmKey =
    event.address.toHexString() + "-" + event.params.pid.toHexString();
  let farm = Farm.load(farmKey)!;

  farm.balance = farm.balance.minus(event.params.amount);

  // user stats
  createUser(event.params.to);

  let fromUserStakingPosition = createStakingPosition(
    farm.pairAddress as Address,
    event.params.user,
    farmKey
  );
  fromUserStakingPosition.stakedTokenBalance = fromUserStakingPosition.stakedTokenBalance.minus(
    event.params.amount
  );
  fromUserStakingPosition.save();
  farm.save();
}

export function handlePoolSet(event: PoolSet): void {
  let allocPoint = event.params.allocPoint;
  let overwrite = event.params.overwrite;
  let pid = event.params.pid;
  let rewarder = event.params.rewarder;
  let minichefKey = event.address.toHexString();
  let farmKey = minichefKey + "-" + pid.toHexString();
  let rewarderId = rewarder.toHexString() + "-" + pid.toHexString();

  let farm = Farm.load(farmKey);

  if (farm !== null) {
    // if we want to overwrite then update rewarder in farm
    if (overwrite) {
      createUpdateRewarder(rewarderId, farmKey);
      farm.rewarder = rewarderId;
    }

    let minichef = Minichef.load(minichefKey);
    let totalAllocPoint = BI_0;

    if (minichef !== null) {
      totalAllocPoint = minichef.totalAllocPoint.plus(
        allocPoint.minus(farm.allocPoint)
      );
    }

    farm.allocPoint = allocPoint;
    createUpdateMiniChef(minichefKey, BI_0, totalAllocPoint, BI_0);
    farm.save();
  }

  createUpdateFarmRewards(rewarder, pid);
}

export function handleLogRewardPerSecond(event: LogRewardPerSecond): void {
  createUpdateMiniChef(
    event.address.toHexString(),
    BI_0,
    BI_0,
    event.params.rewardPerSecond
  );
}

export function handleLogRewardsExpiration(event: LogRewardsExpiration): void {
  createUpdateMiniChef(
    event.address.toHexString(),
    event.params.rewardsExpiration,
    BI_0,
    BI_0
  );
}

/***********
 * Helpers *
 ***********/

function createFarm(
  chef: Address,
  pid: BigInt,
  pair: Address,
  rewarderAddress: Address,
  allocPoint: BigInt
): void {
  let minichefKey = chef.toHexString();

  log.info("createFarm==============minichefKey" + minichefKey, []);

  let minichef = Minichef.load(minichefKey);
  let totalAllocPoint = BI_0;
  if (minichef !== null) {
    log.info("createFarm==============found MInichef", []);

    totalAllocPoint = minichef.totalAllocPoint.plus(allocPoint);
  } else {
    log.info("createFarm==============not found MInichef", []);

    totalAllocPoint = totalAllocPoint.plus(allocPoint);
  }
  createUpdateMiniChef(minichefKey, BI_0, totalAllocPoint, BI_0);

  let farmKey = chef.toHexString() + "-" + pid.toHexString();

  log.info("createFarm==============farmKey" + farmKey, []);

  let rewarderId = rewarderAddress.toHexString() + "-" + pid.toHexString();

  log.info("createFarm==============rewarderId" + rewarderId, []);

  let farm = Farm.load(farmKey);
  if (farm === null) {
    log.info("createFarm==============not found farm", []);

    farm = new Farm(farmKey);
    farm.chefAddress = chef;
    farm.pid = pid;
    farm.pairAddress = pair;
    farm.rewarderAddress = rewarderAddress;
    farm.balance = BI_0;
    farm.allocPoint = allocPoint;
    farm.rewarder = rewarderId;
    farm.minichef = minichefKey;

    let pairData = Pair.load(pair.toHexString());

    if (!!pairData) {
      log.info("createFarm============== found pairData", []);

      farm.pair = pairData.id;
    }

    farm.save();

    createUpdateRewarder(rewarderId, farmKey);

    createUpdateFarmRewards(rewarderAddress, pid);
  }
}
function createUser(userAddress: Address): void {
  let user = User.load(userAddress.toHexString());
  if (user === null) {
    user = new User(userAddress.toHexString());
    user.usdSwapped = BD_0;
    user.save();
  }
}

function createUpdateMiniChef(
  minichefKey: string,
  rewardsExpiration: BigInt = BI_0,
  totalAllocPoint: BigInt = BI_0,
  rewardPerSecond: BigInt = BI_0
): void {
  log.info("createUpdateMiniChef==============minichefKey" + minichefKey, []);

  let minichef = Minichef.load(minichefKey);

  if (minichef !== null) {
    log.info("createUpdateMiniChef==============found MInichef", []);
    if (rewardsExpiration !== BI_0) {
      log.info("createUpdateMiniChef==============found rewardsExpiration", []);

      minichef.rewardsExpiration = rewardsExpiration;
    }

    if (totalAllocPoint !== BI_0) {
      log.info("createUpdateMiniChef==============found totalAllocPoint", []);

      minichef.totalAllocPoint = totalAllocPoint;
    }

    if (rewardPerSecond !== BI_0) {
      log.info("createUpdateMiniChef==============found rewardPerSecond", []);

      minichef.rewardPerSecond = rewardPerSecond;
    }

    minichef.save();
  } else {
    log.info("createUpdateMiniChef==============not found MInichef", []);

    let minichef = new Minichef(minichefKey);
    minichef.rewardsExpiration = rewardsExpiration;
    minichef.totalAllocPoint = totalAllocPoint;
    minichef.rewardPerSecond = rewardPerSecond;
    minichef.save();
  }
}

function createStakingPosition(
  exchange: Address,
  user: Address,
  farmKey: string
): FarmingPosition {
  let id = exchange
    .toHexString()
    .concat("-")
    .concat(user.toHexString());

  log.info("createStakingPosition==============id" + id, []);

  let lp = FarmingPosition.load(id);
  if (lp === null) {
    log.info("createStakingPosition==============not found lp", []);

    lp = new FarmingPosition(id);
    lp.stakedTokenBalance = BI_0;
    lp.farm = farmKey;
    lp.pairAddress = exchange;
    lp.pair = exchange.toHexString();
    lp.userAddress = user;
    lp.user = user.toHexString();
    lp.save();
  }
  return lp as FarmingPosition;
}

function createUpdateRewarder(rewarderId: string, farmKey: string): void {
  log.info("createUpdateRewarder==============rewarderId" + rewarderId, []);
  log.info("createUpdateRewarder==============farmKey" + farmKey, []);

  let farmRewarder = FarmRewarder.load(rewarderId);
  if (farmRewarder === null) {
    log.info("createUpdateRewarder==============not found farmRewarder", []);

    farmRewarder = new FarmRewarder(rewarderId);
    farmRewarder.farm = farmKey;
  }

  farmRewarder.save();
}

export function createUpdateFarmRewards(
  rewarderAddress: Address,
  pid: BigInt
): void {
  let rewarderId = rewarderAddress.toHexString() + "-" + pid.toHexString();

  log.info("createUpdateFarmRewards==============rewarderId" + rewarderId, []);

  let farmRewarder = FarmRewarder.load(rewarderId);

  if (farmRewarder === null) return;

  // create default reward only if we are creating farm rewards
  let defaultRewardKey =
    rewarderAddress.toHexString() + "-" + PNG_ADDRESS + "-" + pid.toString();

  createFarmReward(defaultRewardKey, PNG_ADDRESS, BI_1, rewarderId);

  if (rewarderAddress.toHexString() != ADDRESS_ZERO) {
    log.info(
      "createUpdateFarmRewards==============rewarderAddress is not zero address",
      []
    );

    let rewardTokens = _fetchRewardTokens(rewarderAddress);
    let multipliers = _fetchRewardMultipliers(rewarderAddress);

    if (Array.isArray(rewardTokens)) {
      log.info(
        "createUpdateFarmRewards==============rewardTokens is isArray",
        []
      );

      for (let i = 0; i < rewardTokens.length; ++i) {
        let rewarderAddrKey = rewarderAddress.toHexString();
        let rewardTokensKey = rewardTokens[i].toHexString();

        log.info(
          "createUpdateFarmRewards==============rewarderAddrKey" +
            rewarderAddrKey,
          []
        );

        let rewardKey =
          rewarderAddrKey +
          "-" +
          rewardTokensKey +
          "-" +
          BigInt.fromI32(i).toString();

        let multiplier = multipliers[i];

        log.info(
          "createUpdateFarmRewards==============rewardKey" + rewardKey,
          []
        );
        log.info(
          "createUpdateFarmRewards==============rewardTokensKey" +
            rewardTokensKey,
          []
        );
        log.info(
          "createUpdateFarmRewards==============multiplier" +
            multiplier.toString(),
          []
        );
        log.info(
          "createUpdateFarmRewards==============rewarderId" + rewarderId,
          []
        );
        createFarmReward(rewardKey, rewardTokensKey, multiplier, rewarderId);
      }
    }
  }
}

function createFarmReward(
  rewardKey: string,
  tokenAddress: string,
  multiplier: BigInt,
  rewarderId: string
): void {
  let token = Token.load(tokenAddress)!;
  log.info("createFarmReward==============tokenAddress" + tokenAddress, []);

  log.info("createFarmReward==============token -id" + token.id, []);

  let reward = new FarmReward(rewardKey);

  reward.token = token.id;
  reward.multiplier = multiplier;
  reward.rewarder = rewarderId;
  reward.save();
}

function _fetchRewardTokens(rewarderAddress: Address): Array<Address> {
  let contract = RewarderViaMultiplier.bind(rewarderAddress);
  let totalRewardTokenValue = [] as Array<Address>;
  let totalRewardTokenResult = contract.try_getRewardTokens();

  if (!totalRewardTokenResult.reverted) {
    totalRewardTokenValue = totalRewardTokenResult.value;
  }

  return totalRewardTokenValue;
}

function _fetchRewardMultipliers(rewarderAddress: Address): Array<BigInt> {
  let contract = RewarderViaMultiplier.bind(rewarderAddress);
  let totalRewardMultiplierValue = [] as Array<BigInt>;
  let totalRewardMultiplierResult = contract.try_getRewardMultipliers();
  if (!totalRewardMultiplierResult.reverted) {
    totalRewardMultiplierValue = totalRewardMultiplierResult.value;
  }

  return totalRewardMultiplierValue as Array<BigInt>;
}

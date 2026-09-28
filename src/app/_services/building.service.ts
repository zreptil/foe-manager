import {Injectable} from '@angular/core';
import {GbData} from '@/_model/gb-data';
import {GbUserData} from '@/_model/gb-user-data';
import {GLOBALS} from '@/_services/globals.service';
import {EnumSitemode} from '@/_model/user-data';
import {LevelData} from '@/_model/level-data';

export class PlacesData {
  rewards: number[] = [];
  blocks: number[] = [];
  ownerValue: number;
  ownerRest: number;
}

@Injectable({
  providedIn: 'root',
})
export class BuildingService {
  calcPlaceMethods: any = [this.calcPlacesRewards, this.calcPlacesSupport, this.calcPlacesSniper];
  calcPlaceTitles = [null, $localize`Förderung`, $localize`Sniper`];

  get showInfo() {
    return GLOBALS.user.showInfoGb;
  }

  get isModeSelect() {
    return GLOBALS.user.siteMode === EnumSitemode.select;
  }

  get isModeBuildings() {
    return GLOBALS.user.siteMode === EnumSitemode.buildings;
  }

  get isModeManage() {
    return GLOBALS.user.siteMode === EnumSitemode.manage;
  }

  get isModePlayers() {
    return GLOBALS.user.siteMode === EnumSitemode.players;
  }

  calcReward(reward: number) {
    return Math.round(reward * 1.9);
  }

  gbForUser(gb: GbData): GbUserData {
    if (GLOBALS.user.siteMode === EnumSitemode.buildings) {
      if (GLOBALS.user.activeGbKey === gb.key) {
        return GLOBALS.user.activeUserGb;
      }
      return null;
    }
    return GLOBALS.user.listGb[gb.key];
  }

  levelForUser(gb: GbData, gbUser: GbUserData) {
    return gbUser == null ? null : gb.levels.find(level => level.level === gbUser.level + 1);
  }

  calcPlacesRewards(level: LevelData, _gbUser: GbUserData, ownerValue: number) {
    const ret = new PlacesData();
    let rest = level.cost;
    let lastBlock = 0;
    for (let i = 0; i < level.rewards.length; i++) {
      const reward = this.calcReward(level.rewards[i]);
      ret.rewards.push(reward);
      if (reward > 0) {
        rest -= reward;
        ownerValue = rest - reward;
      }
      if (ownerValue > lastBlock) {
        lastBlock = ownerValue;
      }
      ret.blocks.push(ownerValue);
    }
    ret.ownerValue = lastBlock;
    ret.ownerRest = rest - lastBlock;
    return ret;
  }

  calcPlacesSniper(level: LevelData, gbUser: GbUserData, ownerValue: number) {
    GLOBALS.showConDebug = false;
    GLOBALS.show('calcPlacesSniper');
    const ret = new PlacesData();
    let rest = level.cost - +(ownerValue ?? 0);
    let lastBlock = 0;
    let block = 0;
    let sl = [...gbUser.sniperValues, 0];
    for (let i = 0; i < level.rewards.length; i++) {
      let reward = Math.ceil(rest / 2);
      const slRest = sl[0] === 0 ? sl.slice(1) : sl;
      let sniperRest = 0;
      if (rest - sl[0] > 0) {
        sniperRest = slRest.reduce((s, v) => s + v, 0);
      }
      if (sniperRest < 0 && sl[0] === 0) {
        reward = 0;
      }
      GLOBALS.show(i, `reward=${reward}, rest=${rest}, sniperRest=${sniperRest}`, sl);
      if (reward <= sl[0] || (sl[0] > 0 && sniperRest + reward > rest)) {
        reward = -sl[0];
        if (sl[0] > 0) {
          sl = sl.slice(1);
        }
      }
      if (rest - Math.abs(reward) <= 0 && reward > 0 && rest > 0) {
        reward = rest - 1;
      }
      if (reward > rest) {
        reward = rest;
      }
      ret.rewards.push(reward);
      rest -= Math.abs(reward);
      block = rest - Math.abs(reward);
      if (reward > 0) {
        lastBlock = reward;
      }
      ret.blocks.push(block);
    }
    ret.ownerValue = ownerValue;
    ret.ownerRest = rest;
    GLOBALS.showConDebug = false;
    return ret;
  }

  calcPlacesSupport(level: LevelData, gbUser: GbUserData, ownerValue: number) {
    GLOBALS.showConDebug = false;
    GLOBALS.show('calcPlacesSupport');
    const ret = new PlacesData();
    let sl = [...gbUser.sniperValues, 0];
    let rest = level.cost - +(ownerValue ?? 0);
    let calcOwnerValue = 0;
    let lastReward = 0;
    for (let i = 0; i < level.rewards.length; i++) {
      let reward = this.calcReward(level.rewards[i]);
      const slRest = sl[0] === 0 ? sl.slice(1) : sl;
      let sniperRest = 0;
      const rewardRest = level.rewards.slice(i + 1).reduce((s, v) => s + this.calcReward(v), 0);
      if (rest - sl[0] > 0) {
        sniperRest = slRest.reduce((s, v) => s + v, 0);
      }
      if (sniperRest < 0 && sl[0] === 0) {
        reward = 0;
      }
      GLOBALS.show(i, `reward=${reward}, rest=${rest}, sniperRest=${sniperRest}, rewardRest=${rewardRest}`, sl);
      if (reward <= sl[0] // sniper is bigger than reward
        || (sl[0] > 0 && (
            sniperRest + reward > rest // reward and snipers would exceed rest
            || sniperRest > rewardRest // remaining sniper values would exceed remaining rewards
          )
        )
      ) {
        reward = -sl[0];
        if (sl[0] > 0) {
          sl = sl.slice(1);
        }
      }
      if (rest - Math.abs(reward) <= 0 && reward > 0 && rest > 0) {
        reward = rest - 1;
      }
      if (reward > rest) {
        reward = rest;
      }
      ret.rewards.push(reward);
      rest -= Math.abs(reward);
      calcOwnerValue = rest - Math.abs(reward);
      if (reward > 0) {
        lastReward = reward;
      }
      ret.blocks.push(calcOwnerValue);
    }
    if (+ownerValue > 0) {
      if (rest < 0) {
        ret.ownerValue = +ownerValue;
        ret.ownerRest = rest;
      } else {
        ret.ownerValue = +ownerValue;
        ret.ownerRest = level.cost - ret.rewards.reduce((s, v) => s + Math.abs(v), 0) - ownerValue;
      }
      if (ret.ownerRest > lastReward) {
        ret.ownerValue += ret.ownerRest - lastReward;
        ret.ownerRest = lastReward;
      }
    } else {
      ret.ownerValue = rest - lastReward;
      ret.ownerRest = level.cost - ret.rewards.reduce((s, v) => s + Math.abs(v), 0) - rest + lastReward;
    }
    GLOBALS.showConDebug = false;
    return ret;
  }
}

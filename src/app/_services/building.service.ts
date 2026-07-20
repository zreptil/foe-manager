import {Injectable} from '@angular/core';
import {GbData} from '@/_model/gb-data';
import {GbUserData} from '@/_model/gb-user-data';
import {GLOBALS} from '@/_services/globals.service';
import {EnumSitemode} from '@/_model/user-data';

@Injectable({
  providedIn: 'root',
})
export class BuildingService {
  get isModeSelect() {
    return GLOBALS.user.siteMode === EnumSitemode.select;
  }

  get isModeBuildings() {
    return GLOBALS.user.siteMode === EnumSitemode.buildings;
  }

  get isModeManage() {
    return GLOBALS.user.siteMode === EnumSitemode.manage;
  }

  onFocus(evt: FocusEvent): void {
    (evt?.target as HTMLInputElement)?.select();
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
}

import {Component, effect, input} from '@angular/core';
import {GbData} from '@/_model/gb-data';
import {GbUserData} from '@/_model/gb-user-data';
import {LevelData} from '@/_model/level-data';
import {BuildingService} from '@/_services/building.service';
import {GLOBALS, GlobalsService} from '@/_services/globals.service';
import {EnumSitemode, EnumSortmode} from '@/_model/user-data';
import {Utils} from '@/classes/utils';
import {MessageService} from '@/_services/message.service';

@Component({
  selector: 'app-building',
  standalone: false,
  templateUrl: './building.component.html',
  styleUrl: './building.component.scss',
})
export class BuildingComponent {
  building = input.required<GbData>();
  gbUser: GbUserData;
  nextLevel: LevelData;
  calcMethods = [this.calcSafePlaces, this.calcNicePlaces];
  calcTitles = [$localize`Sicher`, $localize`Nett`];

  constructor(public globals: GlobalsService,
              public msg: MessageService,
              public bs: BuildingService) {
    effect(() => {
      GLOBALS.user._siteMode();
      GLOBALS.user._activeGbKey();
      this.gbUser = this.bs.gbForUser(this.building());
      this.nextLevel = this.bs.levelForUser(this.building(), this.gbUser);
    })
  }

  get gb() {
    return this.building();
  }

  get showSniper() {
    return GLOBALS.user.siteMode === EnumSitemode.buildings ||
      (GLOBALS.user.siteMode === EnumSitemode.manage &&
        (GLOBALS.user.activeGbKey != null || this.gbUser.copyIdx >= 0)
      );
  }

  get ownSort() {
    const sort = GLOBALS.user?.gbSort?.[GLOBALS.user.siteMode];
    return sort?.mode === EnumSortmode.own && sort?.asc;
  }

  protected get classForGb() {
    const ret: string[] = [];
    if (GLOBALS.user.siteMode === EnumSitemode.buildings) {
      return GLOBALS.user.activeGbKey === this.gb.key ? 'selected' : 'buildings';
    }
    if (GLOBALS.user.listGb[this.gb.key]?.active) {
      ret.push('selected');
    }
    if (GLOBALS.user.siteMode === EnumSitemode.manage) {
      if (this.gbUser?.colorIdx) {
        ret.push(`gb-color-${this.gbUser.colorIdx}`);
      }
      if (GLOBALS.user.activeGbKey != null) {
        ret.push('edit');
      }
    }
    ret.push(Object.keys(EnumSitemode).filter(key => isNaN(Number(key)))[GLOBALS.user.siteMode]);
    return ret.join(' ');
  }

  isColumnVisible(idx: number) {
    return GLOBALS.user.activeGbKey != null ||
      (GLOBALS.user.siteMode === EnumSitemode.manage && +(this.gbUser?.copyIdx) === +idx);
  }

  classForCopy(idx: number, def: string[] = []) {
    const ret = [...def];
    if (+idx === +(this.gbUser?.copyIdx ?? -1)) {
      ret.push('copy');
    }
    return ret;
  }

  clickCopyAction(evt: MouseEvent, level: LevelData) {
    evt.stopPropagation();
    navigator.clipboard.writeText(this.copyData(level));
    this.gbUser.timeCopied = Date.now();
    GLOBALS.saveSharedData();
    // this.msg.info($localize`${this.gb.name} wurde kopiert`);
  }

  copyData(level: LevelData) {
    const ret: string[] = [GLOBALS.user.username, this.gb.name];
    const rewards: string[] = [];
    for (let i = 0; i < level.rewards.length; i++) {
      if (this.gbUser.levelMarked[i] && level.rewards[i] > 0) {
        let reward = level.rewards[i];
        if (this.gbUser.copyIdx >= 0) {
          reward = this.calcPlaceValue(this.gbUser.copyIdx, level, i, this.gbUser.ownerValue);
        } else {
          reward = this.bs.calcReward(reward);
        }
        rewards.push(`P${i + 1}(${Math.abs(reward)})`);
      }
    }
    return [...ret, ...rewards.reverse()].join(' ');
  }

  startLevelChange(evt: PointerEvent, diff: number): void {
    evt.preventDefault();
    evt.stopPropagation();
    this.changeLevel(diff);
    GLOBALS.siteConfig.delayTimer = window.setTimeout(() => {
      GLOBALS.siteConfig.repeatTimer = window.setInterval(() => {
        this.changeLevel(diff);
      }, 50);
    }, 500);
  }

  changeLevel(diff: number) {
    this.gbUser.level += diff;
    this.updateLevel();
  }

  stopLevelChange(evt: PointerEvent): void {
    evt.preventDefault();
    evt.stopPropagation();
    clearTimeout(GLOBALS.siteConfig.delayTimer);
    clearInterval(GLOBALS.siteConfig.repeatTimer);
  }

  protected saveLevel(evt?: PointerEvent) {
    evt?.preventDefault();
    this.gbUser.level = Math.max(Math.min(+GLOBALS.siteConfig.levelValue, this.gb.levels.length - 1), 1);
    this.updateLevel();
  }

  protected updateLevel() {
    this.nextLevel = this.bs.levelForUser(this.gb, this.gbUser);
    GLOBALS.siteConfig.levelGbKey = null;
    this.gbUser.ownerValue = 0;
    this.gbUser.sniperValues = [];
    this.gbUser.copyIdx = -1;
    if (GLOBALS.user.siteMode === EnumSitemode.buildings && this.gb.key === GLOBALS.user.activeGbKey) {
      GLOBALS.user.activeUserGb = this.gbUser;
    }
    if (GLOBALS.user.siteMode === EnumSitemode.manage || GLOBALS.user.siteMode === EnumSitemode.buildings) {
      GLOBALS.saveSharedData();
    }
  }

  protected classForReward(idx: number) {
    if (GLOBALS.user.siteMode === EnumSitemode.buildings) {
      return '';
    }
    return this.gbUser.levelMarked[idx] ? 'marked' : '';
  }

  protected clickRow(evt: PointerEvent, idx: number) {
    evt.stopPropagation();
    this.gbUser.levelMarked[idx] = !this.gbUser.levelMarked[idx];
    GLOBALS.saveSharedData();
  }

  protected ownerValueMax(level: LevelData) {
    let calc = level.cost;
    let ret = 0;
    for (let i = 0; i < level.rewards.length; i++) {
      const reward = this.bs.calcReward(level.rewards[i]);
      if (reward > 0) {
        if (calc - 2 * reward > ret) {
          ret = calc - 2 * reward;
        }
        calc -= reward;
      }
    }
    return ret;
  }

  protected calcBlockValue(method: number, level: LevelData, idx: number) {
    let calc = level.cost;
    let ret = 0;
    for (let i = 0; i <= idx; i++) {
      let reward = this.bs.calcReward(level.rewards[i]);
      if (method >= 0) {
        reward = Math.abs(this.calcPlaceValue(method, level, i, this.gbUser.ownerValue));
      }
      if (reward > 0) {
        if (calc - 2 * reward > ret) {
          ret = calc - 2 * reward;
        }
        calc -= reward;
      }
    }
    return ret;
  }

  protected classForBlock(method: number, level: LevelData, idx: number): string {
    const bc = this.calcBlockValue(method, level, idx);
    if (bc > 0) {
      for (let i = idx + 1; i <= 5 && level.rewards[i] > 0; i++) {
        const bn = this.calcBlockValue(method, level, i);
        if (bn > 0) {
          return '';
        }
      }
      return ''; //'owner';
    }
    return '';
  }

  protected saveOwnerValue(evt?: PointerEvent) {
    evt?.preventDefault();
    GLOBALS.siteConfig.editField = null;
    GLOBALS.saveSharedData();
  }

  protected saveSniperValue(evt?: PointerEvent, addNewValue = false) {
    evt?.preventDefault();
    this.gbUser.sniperValues ??= [];
    if (!Utils.isEmpty(GLOBALS.siteConfig.sniperValue)) {
      this.gbUser.sniperValues.push(GLOBALS.siteConfig.sniperValue);
      this.gbUser.sniperValues = this.gbUser.sniperValues.map(a => +a)
      this.gbUser.sniperValues.sort((a, b) => b - a);
    }
    GLOBALS.siteConfig.sniperValue = null;
    if (!addNewValue || this.gbUser.sniperValues.length >= 5) {
      GLOBALS.siteConfig.editField = null;
    }
    GLOBALS.saveSharedData();
  }

  protected clickSniperValue(evt: PointerEvent, idx: number) {
    evt.preventDefault();
    this.gbUser.sniperValues.splice(idx, 1);
  }

  protected classForPlaceValue(method: number, level: LevelData, idx: number, ownerValue: number) {
    const ret: string[] = [];
    const value = Math.abs(this.calcPlaceValue(method, level, idx, ownerValue));
    if (value <= 0 || this.bs.calcReward(level.rewards[idx]) < value) {
      ret.push('negative');
    } else {
      ret.push('positive');
    }
    return ret;
  }

  protected calcPlaceValue(method: number, level: LevelData, idx: number, ownerValue: number) {
    return this.calcMethods[method].bind(this)(level, idx, ownerValue);
  }

  protected calcTotal(method: number, level: LevelData, ownerValue: number) {
    let ret = level.cost - this.calcMethods[method].bind(this)(level, -2, ownerValue);
    for (let i = 0; i < level.rewards.length; i++) {
      if (level.rewards[i] > 0) {
        ret -= Math.abs(this.calcMethods[method].bind(this)(level, i, ownerValue));
      }
    }
    return ret;
  }

  protected calcNicePlaces(level: LevelData, idx: number, ownerValue: number) {
    if (Utils.isEmpty(ownerValue) || +ownerValue === 0) {
      ownerValue = this.calcBlockValue(-1, level, 0);
    }
    switch (idx) {
      case -2:
        return ownerValue;
      case -1:
        return level.cost - ownerValue;
    }
    const sl = [...this.gbUser.sniperValues, 0];
    let base = level.cost - +(ownerValue ?? 0);
    let ret = base;
    let sniperIdx = 0;
    const reward = this.bs.calcReward(level.rewards[idx]);
    let rewIdx = 0;
    while (idx >= 0) {
      const rew = this.bs.calcReward(level.rewards[rewIdx]);
      ret = Math.min(rew, Math.floor(base / 2));
      if (ret <= sl[sniperIdx]) {
        if (idx === 0) {
          return -sl[sniperIdx];
        }
        ret = sl[sniperIdx];
        sniperIdx++;
      }
      base -= ret;
      if (base < 0) {
        return 0;
      }
      idx--;
      rewIdx++;
    }
    return Math.min(reward, base);
  }

  protected calcSafePlaces(level: LevelData, idx: number, ownerValue: number) {
    switch (idx) {
      case -2:
        return ownerValue;
      case -1:
        return level.cost - (ownerValue ?? 0);
    }
    const sl = [...this.gbUser.sniperValues, 0];
    let base = level.cost - +(ownerValue ?? 0);
    let ret = base;
    let sniperIdx = 0;
    while (idx >= 0) {
      ret = Math.ceil(base / 2);
      if (ret <= sl[sniperIdx]) {
        if (idx === 0) {
          return -sl[sniperIdx];
        }
        ret = sl[sniperIdx];
        sniperIdx++;
      }
      base -= ret;
      if (base < 0) {
        return 0;
      }
      idx--;
    }
    return ret;
  }

  // protected clickGBMark(evt: PointerEvent) {
  //   evt.preventDefault();
  //   if (this.gbUser != null) {
  //     this.gbUser.colorIdx = !this.gbUser.colorIdx;
  //     GLOBALS.saveSharedData();
  //   }
  // }

  protected clickColor(evt: PointerEvent, idx: number) {
    if (this.gbUser != null) {
      this.gbUser.colorIdx = idx;
      GLOBALS.saveSharedData();
    }
  }

  protected clickGBEdit(evt: PointerEvent) {
    evt.preventDefault();
    if (GLOBALS.user.activeGbKey == null) {
      GLOBALS.user.activeGbKey = this.gb.key;
      GLOBALS.user.activeUserGb = this.bs.gbForUser(this.gb);
    } else {
      GLOBALS.user.activeGbKey = null;
      GLOBALS.user.activeUserGb = null;
    }
  }

  protected clickGBCard(evt: PointerEvent) {
    evt.preventDefault();
    switch (GLOBALS.user.siteMode) {
      case EnumSitemode.select:
        const found = GLOBALS.user.listGb[this.gb.key];
        if (found == null) {
          GLOBALS.user.listGb[this.gb.key] = new GbUserData({a: 1, b: 0, e: true});
        } else {
          found.active = !found.active;
        }
        GLOBALS.saveSharedData();
        break;
      case EnumSitemode.manage:
        break;
      case EnumSitemode.buildings:
        if (GLOBALS.user.activeGbKey !== this.gb.key) {
          GLOBALS.user.activeGbKey = this.gb.key;
          GLOBALS.user.activeUserGb = new GbUserData({a: 1});
          GLOBALS.saveSharedData();
        }
        break;
    }
  }

  protected clickEditLevel(evt: PointerEvent) {
    evt?.preventDefault();
    GLOBALS.siteConfig.levelGbKey = this.gb.key;
    GLOBALS.siteConfig.levelValue = this.gbUser.level;
  }

  protected clickOwnerValue(evt: PointerEvent) {
    evt.preventDefault();
    GLOBALS.siteConfig.editField = 'owner';
  }

  protected clickCopyIdx(evt: PointerEvent, idx: number) {
    evt?.preventDefault();
    this.gbUser.copyIdx = +idx;
    GLOBALS.saveSharedData();
  }

  protected clickOwnSort(evt: PointerEvent, diff: number) {
    let gbUser: GbUserData = null;
    for (let i = 0; i < GLOBALS.gbList.length && gbUser == null; i++) {
      const temp = this.bs.gbForUser(GLOBALS.gbList[i]);
      if (temp.sortIdx === this.gbUser.sortIdx + diff) {
        gbUser = temp;
      }
    }
    if (gbUser != null) {
      gbUser.sortIdx = this.gbUser.sortIdx;
      this.gbUser.sortIdx += diff;
      GLOBALS.saveSharedData();
    }
  }
}

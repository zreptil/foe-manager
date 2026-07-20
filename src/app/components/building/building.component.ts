import {Component, effect, input} from '@angular/core';
import {GbData} from '@/_model/gb-data';
import {GbUserData} from '@/_model/gb-user-data';
import {LevelData} from '@/_model/level-data';
import {BuildingService} from '@/_services/building.service';
import {GLOBALS, GlobalsService} from '@/_services/globals.service';
import {EnumSitemode} from '@/_model/user-data';
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
  calcMethods = [this.calcSafePlaces];

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
      (GLOBALS.user.siteMode === EnumSitemode.manage && this.gbUser.marked &&
        GLOBALS.isDebug);
  }

  protected get classForGb() {
    const ret: string[] = [];
    if (GLOBALS.user.siteMode === EnumSitemode.buildings) {
      return GLOBALS.user.activeGbKey === this.gb.key ? 'selected' : 'buildings';
    }
    if (GLOBALS.user.listGb[this.gb.key]?.active) {
      ret.push('selected');
    }
    if (GLOBALS.user.siteMode === EnumSitemode.manage && this.gbUser?.marked) {
      ret.push('gb-marked');
    }
    ret.push(Object.keys(EnumSitemode).filter(key => isNaN(Number(key)))[GLOBALS.user.siteMode]);
    return ret.join(' ');
  }

  clickCopyAction(evt: MouseEvent, level: LevelData) {
    evt.stopPropagation();
    navigator.clipboard.writeText(this.copyData(level));
    this.gbUser.timeCopied = Date.now();
    GLOBALS.saveSharedData();
    this.msg.info($localize`${this.gb.name} wurde kopiert`);
  }

  copyData(level: LevelData) {
    const ret: string[] = [GLOBALS.user.username, this.gb.name];
    let place = 1;
    const rewards: string[] = [];
    for (const reward of level.rewards) {
      if (reward > 0 && this.gbUser.levelMarked[place - 1]) {
        rewards.push(`P${place}(${this.bs.calcReward(reward)})`);
      }
      place++;
    }
    return [...ret, ...rewards.reverse()].join(' ');
  }

  startLevelChange(evt: PointerEvent, diff: number): void {
    evt.preventDefault();
    this.changeLevel(diff);
    GLOBALS.siteConfig.delayTimer = window.setTimeout(() => {
      GLOBALS.siteConfig.repeatTimer = window.setInterval(() => {
        this.changeLevel(diff);
      }, 50);
    }, 500);
  }

  changeLevel(diff: number) {
    this.gbUser.level += diff;
    this.nextLevel = this.bs.levelForUser(this.gb, this.gbUser);
    if (GLOBALS.user.siteMode === EnumSitemode.manage || GLOBALS.user.siteMode === EnumSitemode.buildings) {
      GLOBALS.saveSharedData();
    }
  }

  stopLevelChange(evt: PointerEvent): void {
    evt.preventDefault();
    clearTimeout(GLOBALS.siteConfig.delayTimer);
    clearInterval(GLOBALS.siteConfig.repeatTimer);
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

  protected classForBlock(level: LevelData, idx: number): string {
    // Wenn der Platz schon sicher ist, wird er nie markiert
    if (idx > 0 && level.blocks[idx] <= level.blocks[idx - 1]) {
      return '';
    }
    const lastIdx = this.findLastOwnerBlock(level);
    if (idx === lastIdx) {
      return idx === 0 || level.blocks[idx] > level.blocks[idx - 1] ? 'owner' : '';
    }
    if (idx > 0 && idx < level.blocks?.length && level.blocks[idx + 1] < level.blocks[idx]) {
      return 'owner';
    }
    return '';
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
  }

  protected clickSniperValue(evt: PointerEvent, idx: number) {
    evt.preventDefault();
    this.gbUser.sniperValues.splice(idx, 1);
  }

  protected classForPlaceValue(method: number, level: LevelData, idx: number, ownerValue: number) {
    const value = Math.abs(this.calcPlaceValue(method, level, idx, ownerValue));
    if (value <= 0 || this.bs.calcReward(level.rewards[idx]) < value) {
      return 'negative';
    }
    return 'positive';
  }

  protected calcPlaceValue(method: number, level: LevelData, idx: number, ownerValue: number) {
    return this.calcMethods[method].bind(this)(level, idx, ownerValue);
  }

  protected calcTotal(method: number, level: LevelData, ownerValue: number) {
    let ret = 0;
    for (let i = 0; i < level.rewards.length; i++) {
      if (level.rewards[i] > 0) {
        ret += Math.abs(this.calcMethods[method].bind(this)(level, i, ownerValue));
      }
    }
    return level.cost - ret - (ownerValue ?? 0);
  }

  protected calcSafePlaces(level: LevelData, idx: number, ownerValue: number) {
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

  protected clickGBMark(evt: PointerEvent) {
    evt.preventDefault();
    if (this.gbUser != null) {
      this.gbUser.marked = !this.gbUser.marked;
      GLOBALS.saveSharedData();
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
//        if (GLOBALS.user.activeGbKey !== this.gb.key) {
        GLOBALS.user.activeGbKey = this.gb.key;
        GLOBALS.user.activeUserGb = new GbUserData({a: 1});
        GLOBALS.saveSharedData();
//        }
        break;
    }
  }

  protected saveLevel(evt?: PointerEvent) {
    evt?.preventDefault();
    this.gbUser.level = Math.max(Math.min(+GLOBALS.siteConfig.levelValue, this.gb.levels.length - 1), 1);
    this.nextLevel = this.bs.levelForUser(this.gb, this.gbUser);
    GLOBALS.siteConfig.levelGbKey = null;
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

  protected findLastOwnerBlock(level: LevelData) {
    let ret = 0;
    for (let i = 1; i < level.blocks.length; i++) {
      if (level.blocks[i - 1] < level.blocks[i] && level.blocks[i] > 0) {
        ret = i;
      }
    }
    return ret;
  }
}

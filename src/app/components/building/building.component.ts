import {Component, effect, input} from '@angular/core';
import {GbData} from '@/_model/gb-data';
import {GbUserData} from '@/_model/gb-user-data';
import {LevelData} from '@/_model/level-data';
import {BuildingService, PlacesData} from '@/_services/building.service';
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
  placesData: PlacesData[] = [];
  showLevelHint = false;

  constructor(public globals: GlobalsService,
              public msg: MessageService,
              public bs: BuildingService) {
    effect(() => {
      GLOBALS.user._factor();
      GLOBALS.user._siteMode();
      GLOBALS.user._activeGbKey();
      this.gbUser = this.bs.gbForUser(this.building());
      if (this.gbUser != null && this.gbUser.copyIdx > this.bs.calcPlaceMethods.length - 1) {
        this.gbUser.copyIdx = this.bs.calcPlaceMethods.length - 1;
      }
      this.nextLevel = this.bs.levelForUser(this.building(), this.gbUser);
      if (this.gbUser != null && this.nextLevel != null) {
        this.calcPlaces(this.nextLevel, this.gbUser.ownerValue);
      }
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

  get showEditIcon() {
    const currSort = GLOBALS.user?.gbSort?.[GLOBALS.user.siteMode];
    let ret = this.bs.isModeManage;
    if (currSort?.mode === EnumSortmode.own) {
      ret &&= !currSort.asc;
    }
    return ret;
  }

  get classForCopyButton() {
    const ret = [];
    if (GLOBALS.user.copyColorIdx >= 0) {
      ret.push(`color-${GLOBALS.user.copyColorIdx}`);
    }
    return ret;
  }

  protected get classForGb() {
    const ret: string[] = [];
    if (GLOBALS.user.siteMode === EnumSitemode.manage || GLOBALS.user.siteMode === EnumSitemode.buildings) {
      if (this.gbUser?.colorIdx) {
        ret.push(`gb color-${this.gbUser.colorIdx}`);
      }
      if (GLOBALS.user.activeGbKey != null) {
        ret.push('edit');
      }
    }
    if (GLOBALS.user.siteMode === EnumSitemode.buildings) {
      ret.push(GLOBALS.user.activeGbKey === this.gb.key ? 'selected' : 'buildings');
      return ret;
    }
    if (GLOBALS.user.listGb[this.gb.key]?.active) {
      ret.push('selected');
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
    if (this.placesData[idx + 1].ownerValue < 0) {
      ret.push('negative');
    }
    return ret;
  }

  clickCopyAction(evt: MouseEvent, level: LevelData, setColor = false) {
    evt.stopPropagation();
    navigator.clipboard.writeText(this.copyData(level));
    this.gbUser.timeCopied = Date.now();
    if (setColor && GLOBALS.user.copyColorIdx >= 0) {
      this.gbUser.colorIdx = GLOBALS.user.copyColorIdx;
    }
    GLOBALS._gbList = null;
    this.saveSharedData();
    // this.msg.info($localize`${this.gb.name} wurde kopiert`);
  }

  copyData(level: LevelData) {
    const ret: string[] = [GLOBALS.user.username, this.gb.name];
    const rewards: string[] = [];
    for (let i = 0; i < level.rewards.length; i++) {
      if (this.gbUser.levelMarked[i] && level.rewards[i] > 0) {
        let reward = level.rewards[i];
        if (this.gbUser.copyIdx >= 0) {
          reward = this.placesData[this.gbUser.copyIdx + 1].rewards[i];
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

  isMaxLevel(gb: GbData, gbUser: GbUserData) {
    return !gb.levels.some(l => l.level > gbUser.level + 1);
  }

  changeLevel(diff: number) {
    if (diff !== 0) {
      this.gbUser.level += diff;
      const max = this.gb.maxLevel;
      const min = 2;
      let done = false;
      while (!done && !this.gb.levels.some(l => l.level === this.gbUser.level + 1)) {
        if (this.gbUser.level < min) {
          this.gbUser.level = min;
          done = true;
        } else if (this.gbUser.level > max) {
          this.gbUser.level = max - 1;
          done = true;
        } else {
          this.gbUser.level += diff;
        }
      }
    }
    this.updateLevel();
  }

  stopLevelChange(evt: PointerEvent): void {
    evt.preventDefault();
    evt.stopPropagation();
    clearTimeout(GLOBALS.siteConfig.delayTimer);
    clearInterval(GLOBALS.siteConfig.repeatTimer);
  }

  calcPlaces(level: LevelData, ownerValue: number) {
    this.placesData = [];
    for (let method = 0; method < this.bs.calcPlaceMethods.length; method++) {
      this.placesData.push(this.bs.calcPlaceMethods[method].bind(this.bs)(level, this.gbUser, ownerValue));
    }
  }

  saveSharedData() {
    if (this.gbUser != null) {
      this.calcPlaces(this.nextLevel, this.gbUser.ownerValue);
    }
    GLOBALS.saveSharedData();
  }

  protected saveLevel(evt?: PointerEvent) {
    evt?.preventDefault();
    let levelValid = +GLOBALS.siteConfig.levelValue > 1 && this.gb.levels.some(l => l.level === +GLOBALS.siteConfig.levelValue + 1);
    if (levelValid) {
      this.gbUser.level = +GLOBALS.siteConfig.levelValue;
      this.updateLevel();
    } else {
      GLOBALS.siteConfig.levelGbKey = null;
    }
    this.showLevelHint = !levelValid;
  }

  protected updateLevel() {
    this.showLevelHint = false;
    this.nextLevel = this.bs.levelForUser(this.gb, this.gbUser);
    GLOBALS.siteConfig.levelGbKey = null;
    this.gbUser.ownerValue = 0;
    this.gbUser.sniperValues = [];
    this.gbUser.copyIdx = -1;
    if (GLOBALS.user.siteMode === EnumSitemode.buildings && this.gb.key === GLOBALS.user.activeGbKey) {
      GLOBALS.user.activeUserGb = this.gbUser;
    }
    if (GLOBALS.user.resetLevelColor) {
      this.gbUser.colorIdx = 0;
      this.gbUser.levelMarked = [true, true, true, true, true];
    }
    if (GLOBALS.user.siteMode === EnumSitemode.manage || GLOBALS.user.siteMode === EnumSitemode.buildings) {
      GLOBALS._gbList = null;
      this.saveSharedData();
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
    this.saveSharedData();
  }

  protected saveOwnerValue(evt?: PointerEvent) {
    evt?.preventDefault();
    GLOBALS.siteConfig.editField = null;
    this.saveSharedData();
  }

  protected clearOwnerValue(evt?: PointerEvent) {
    evt?.preventDefault();
    this.gbUser.ownerValue = null;
    GLOBALS.siteConfig.editField = null;
    this.saveSharedData();
  }

  protected saveSniperValue(evt?: PointerEvent, addNewValue = false) {
    evt?.preventDefault();
    this.gbUser.sniperValues ??= [];
    if (!Utils.isEmpty(GLOBALS.siteConfig.sniperValue) && GLOBALS.siteConfig.sniperValue > 0) {
      this.gbUser.sniperValues.push(GLOBALS.siteConfig.sniperValue);
      this.gbUser.sniperValues = this.gbUser.sniperValues.map(a => +a)
      this.gbUser.sniperValues.sort((a, b) => b - a);
    }
    if (!addNewValue || this.gbUser.sniperValues.length >= 5 || Utils.isEmpty(GLOBALS.siteConfig.sniperValue)) {
      GLOBALS.siteConfig.editField = null;
    }
    GLOBALS.siteConfig.sniperValue = null;
    this.saveSharedData();
  }

  protected clickSniperValue(evt: PointerEvent, idx: number) {
    evt.preventDefault();
    this.gbUser.sniperValues.splice(idx, 1);
    this.calcPlaces(this.nextLevel, this.gbUser.ownerValue);
    this.saveSharedData();
  }

  protected classForPlace(placeIdx: number, level: LevelData, idx: number) {
    const ret: string[] = [];
    if (placeIdx > 0) {
      const place = this.placesData[placeIdx];
      const value = Math.abs(place.rewards[idx]);
      if (value <= 0 || this.bs.calcReward(level.rewards[idx]) < value) {
        ret.push('negative');
      } else {
        ret.push('positive');
      }
    }
    return ret;
  }

  protected clickColor(evt: PointerEvent, idx: number) {
    if (this.gbUser != null) {
      if (this.gbUser.colorIdx === idx) {
        if (GLOBALS.user.copyColorIdx === idx) {
          GLOBALS.user.copyColorIdx = -1;
        } else {
          GLOBALS.user.copyColorIdx = idx;
        }
      }
      this.gbUser.colorIdx = idx;
      navigator.clipboard.writeText(this.copyData(this.nextLevel));
      this.saveSharedData();
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
      GLOBALS._gbList = null;
    }
    this.saveSharedData();
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
        this.saveSharedData();
        break;
      case EnumSitemode.manage:
        break;
      case EnumSitemode.buildings:
        if (GLOBALS.user.activeGbKey !== this.gb.key) {
          GLOBALS.user.activeGbKey = this.gb.key;
          GLOBALS.user.activeUserGb = new GbUserData({a: 1});
          this.saveSharedData();
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
    this.saveSharedData();
  }

  protected clickOwnSort(evt: PointerEvent, diff: number) {
    let gbUser: GbUserData = null;
    if (diff === -2) {
      this.gbUser.sortIdx = -1;
    } else if (diff === 2) {
      this.gbUser.sortIdx = GLOBALS.gbList.length;
    } else {
      for (let i = 0; i < GLOBALS.gbList.length && gbUser == null; i++) {
        const temp = this.bs.gbForUser(GLOBALS.gbList[i]);
        if (temp.sortIdx === this.gbUser.sortIdx + diff) {
          gbUser = temp;
        }
      }
      if (gbUser != null) {
        gbUser.sortIdx = this.gbUser.sortIdx;
        this.gbUser.sortIdx += diff;
      }
    }
    GLOBALS._gbList = null;
    this.saveSharedData();
  }

  // protected clickSecure(evt: PointerEvent) {
  //   evt?.preventDefault();
  //   GLOBALS.showConDebug = false;
  //   for (let idx = 0; idx < this.nextLevel.rewards.length; idx++) {
  //     const value = this.calcPlaceValue(this.gbUser.copyIdx, this.nextLevel, idx, this.gbUser.ownerValue);
  //     GLOBALS.show(idx, value);
  //     if (value > 0) {
  //       this.gbUser.sniperValues.push(value);
  //       this.gbUser.sniperValues = this.gbUser.sniperValues.map(a => +a)
  //       this.gbUser.sniperValues.sort((a, b) => b - a);
  //     }
  //   }
  //   let sum = this.nextLevel.cost;
  //   let hasLast = false;
  //   for (let i = this.gbUser.sniperValues.length - 1; i >= 0; i--) {
  //     sum -= this.gbUser.sniperValues[i];
  //     if (this.gbUser.sniperValues[i] >= 0 && !hasLast) {
  //       hasLast = true;
  //       sum -= this.gbUser.sniperValues[i];
  //     }
  //   }
  //   GLOBALS.show('ach guck', sum, this.nextLevel.cost);
  //   if (this.gbUser.ownerValue > sum) {
  //     GLOBALS.msg.error(`Der eingezahlte Eigenanteil übersteigt die benötigte Absicherung von ${sum}.`);
  //     // .subscribe((result: DialogResult) => {
  //     //   if (result.btn === DialogResultButton.yes) {
  //     //     this.gbUser.ownerValue = sum;
  //     //   }
  //     // });
  //   } else {
  //     this.gbUser.ownerValue = sum;
  //   }
  //   GLOBALS.showConDebug = false;
  // }

  protected classForColor(idx: number) {
    const ret: string[] = [`color-${idx}`];
    if (idx === this.gbUser.colorIdx) {
      ret.push('current');
    }
    return ret;
  }
}

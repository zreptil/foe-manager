import {Component, effect, input} from '@angular/core';
import {GLOBALS, GlobalsService} from '@/_services/globals.service';
import {MessageService} from '@/_services/message.service';
import {BuildingService} from '@/_services/building.service';
import {GbData} from '@/_model/gb-data';
import {GbUserData} from '@/_model/gb-user-data';
import {EnumSortmode} from '@/_model/user-data';
import {Utils} from '@/classes/utils';

@Component({
  selector: 'app-analysis',
  standalone: false,
  templateUrl: './analysis.component.html',
  styleUrl: './analysis.component.scss',
})
export class AnalysisComponent {
  epoch = input<number>();
  gbList: { gb: GbData, user: GbUserData }[];
  protected readonly effect = effect;
  protected readonly EnumSortmode = EnumSortmode;

  constructor(public globals: GlobalsService,
              public msg: MessageService,
              public bs: BuildingService) {
    effect(() => {
      GLOBALS._user();
      GLOBALS.user._siteMode();
      GLOBALS.force();
      this.gbList = [];
      const list = GLOBALS.gbList.filter(gb => this.epoch() == null || this.epoch() === gb.epoch);
      for (const gb of list) {
        this.gbList.push({gb, user: this.bs.gbForUser(gb)});
      }
    });
  }

  get sortMode() {
    return this.globals.user?.gbSort?.[this.globals.user.siteMode]?.mode;
  }

  protected missingFP(data: { gb: GbData; user: GbUserData }) {
    const levels = data.gb.levels.filter(l => l.level > data.user.level && l.level <= GLOBALS.user.analysis.targetLevel);
    return levels.reduce((acc, l) => acc + l.cost, 0);
  }

  protected fpForLevelUp(data: { gb: GbData; user: GbUserData }) {
    return data.gb.levels[data.user.level]?.cost
      - data.user.ownerValue
      - data.user.sniperValues.reduce((acc, v) => acc + v, 0);
  }

  protected classForRow(data: { gb: GbData; user: GbUserData }) {
    const ret: string[] = [];
    if (GLOBALS.user.analysis.showColors) {
      ret.push(`color color-${data.user?.colorIdx}`);
    }
    if (GLOBALS.user.analysis.targetLevel > 0) {
      if (data.user.level >= GLOBALS.user.analysis.targetLevel) {
        ret.push('target');
      }
    }
    return Utils.join(ret, ' ');
  }

  protected needEpochHead(idx: number) {
    return idx === 0 || this.gbList[idx].gb.epoch !== this.gbList[idx - 1].gb.epoch;
  }
}

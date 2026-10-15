import {Component, effect, input} from '@angular/core';
import {GLOBALS, GlobalsService} from '@/_services/globals.service';
import {MessageService} from '@/_services/message.service';
import {BuildingService} from '@/_services/building.service';
import {GbData} from '@/_model/gb-data';
import {GbUserData} from '@/_model/gb-user-data';
import {EnumSortmode} from '@/_model/user-data';

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

  protected classForRow(data: { gb: GbData; user: GbUserData }) {
    if (!GLOBALS.user.analysis.showColors) {
      return '';
    }
    return `color color-${data.user?.colorIdx}`;
  }

  protected needEpochHead(idx: number) {
    return idx === 0 || this.gbList[idx].gb.epoch !== this.gbList[idx - 1].gb.epoch;
  }
}

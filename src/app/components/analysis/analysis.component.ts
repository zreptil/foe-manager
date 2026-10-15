import {Component, effect, input} from '@angular/core';
import {GLOBALS, GlobalsService} from '@/_services/globals.service';
import {MessageService} from '@/_services/message.service';
import {BuildingService} from '@/_services/building.service';
import {GbData} from '@/_model/gb-data';
import {GbUserData} from '@/_model/gb-user-data';

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

  protected classForRow(data: { gb: GbData; user: GbUserData }) {
    if (!GLOBALS.user.analysis.showColors) {
      return '';
    }
    return `color color-${data.user?.colorIdx}`;
  }
}

import {Component, effect, input} from '@angular/core';
import {BuildingService} from '@/_services/building.service';
import {GLOBALS, GlobalsService} from '@/_services/globals.service';
import {MessageService} from '@/_services/message.service';
import {EnumEpoch} from '@/_model/gb-data';

@Component({
  selector: 'app-epoch',
  standalone: false,
  templateUrl: './epoch.component.html',
  styleUrl: './epoch.component.scss',
})
export class EpochComponent {
  epoch = input.required<EnumEpoch>();

  constructor(public globals: GlobalsService,
              public msg: MessageService,
              public bs: BuildingService) {
    effect(() => {
      GLOBALS.user._siteMode();
      GLOBALS.user._activeGbKey();
    })
  }
}

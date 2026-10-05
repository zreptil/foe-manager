import {Component} from '@angular/core';
import {EventService} from '@/_services/event.service';
import {GLOBALS, GlobalsService} from '@/_services/globals.service';
import {EnumEventtype, EventData} from '@/_model/event-data';
import {DomSanitizer} from '@angular/platform-browser';
import {MessageService} from '@/_services/message.service';
import {HelpComponent} from '@/components/help/help.component';

@Component({
  selector: 'app-events',
  standalone: false,
  templateUrl: './events.component.html',
  styleUrl: './events.component.scss',
})
export class EventsComponent {
  protected readonly EnumEventtype = EnumEventtype;

  constructor(public globals: GlobalsService,
              public eventSrv: EventService,
              public msg: MessageService,
              public sanitizer: DomSanitizer) {
    if (!eventSrv.fullyLoaded) {
      eventSrv.loadFromAsset((_data) => {
      });
    }
  }

  get event() {
    return this.eventSrv?.eventList?.[GLOBALS.user.eventConfig.eventIdx] ?? new EventData();
  }

  protected clickHelp(evt: PointerEvent, idx: number) {
    evt.preventDefault();
    this.msg.showPopup(HelpComponent, 'help', {
      title: `event${idx}`
    });
  }
}

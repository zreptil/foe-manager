import {Component} from '@angular/core';
import {EventService} from '@/_services/event.service';
import {GLOBALS, GlobalsService} from '@/_services/globals.service';
import {EnumEventtype, EventData} from '@/_model/event-data';
import {EventTownData} from '@/_model/event-place-data';
import {Utils} from '@/classes/utils';
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
  editField: string;
  phaseValue: number;
  eventCount: number;
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

  get townIdx() {
    return this.townIdxForCount(GLOBALS.user.eventConfig.eventCount);
  }

  get town(): EventTownData {
    return this.event?.towns?.[this.townIdx] ?? new EventTownData();
  }

  get progress() {
    return this.town.progress ?? [] as [number, number][];
  }

  get event() {
    return this.eventSrv?.eventList?.[GLOBALS.user.eventConfig.eventIdx] ?? new EventData();
  }

  protected get progressInfo() {
    const ret = this.town.progressInfo?.find((info) => info.idx === GLOBALS.user.eventConfig.progressIdx)?.info;
    if (ret == null) {
      return null;
    }
    return this.sanitizer.bypassSecurityTrustHtml(Utils.cvtToHtml(ret));
  }

  protected get panelName() {
    return 'panel';
  }

  protected get styleForMap() {
    return {
      backgroundImage: `url(${this.event.backgroundImage})`
    };
  }

  townIdxForCount(round: number) {
    if (round === 0) {
      return 0;
    }
    return round % 3 + 1;
  }

  protected styleForPlace(placeIdx: number) {
    const place = this.event.places[placeIdx];
    const ret: any = {
      left: `${place.x}%`,
      top: `${place.y}%`,
    };
    if (this.placeProgress(placeIdx) === 0) {
      ret.display = 'none';
    }
    return ret;
  }

  protected level(placeIdx: number) {
    return this.event.places[placeIdx].levels[this.townIdxForCount(GLOBALS.user.eventConfig.eventCount)];
  }

  protected classForPlace(placeIdx: number) {
    const ret: string[] = [];
    if (this.progress[GLOBALS.user.eventConfig.progressIdx][0] === placeIdx) {
      ret.push('current');
      if (GLOBALS.user.eventConfig.progressIdx === this.progress.length - 1) {
        ret.push('last');
      }
    }
    return ret;
  }

  protected placeProgress(placeIdx: number) {
    let ret = 0;
    for (let i = 0; i <= GLOBALS.user.eventConfig.progressIdx && i < this.progress.length; i++) {
      if (this.progress[i][0] === placeIdx) {
        ret = this.progress[i][1];
      }
    }
    return ret;
  }

  protected nameForTown(idx: number) {
    if (idx === 0) {
      return $localize`Erste Stadt`;
    }
    return $localize`Stadt #${idx}`;
  }

  protected clickProgress(evt: PointerEvent, diff: number) {
    evt.preventDefault();
    GLOBALS.user.eventConfig.progressIdx = Math.max(0, Math.min(this.progress.length - 1, GLOBALS.user.eventConfig.progressIdx + diff));
    GLOBALS.saveSharedData();
  }

  protected clickPlace(evt: PointerEvent, placeIdx: number) {
    evt.preventDefault();
    if (this.progress[GLOBALS.user.eventConfig.progressIdx][0] === placeIdx) {
      GLOBALS.user.eventConfig.progressIdx++;
    } else {
      let idx = GLOBALS.user.eventConfig.progressIdx;
      while (idx > 0 && this.progress[idx][0] !== placeIdx) {
        idx--;
      }
      GLOBALS.user.eventConfig.progressIdx = idx;
    }
    GLOBALS.saveSharedData();
  }

  protected savePhase(evt?: PointerEvent) {
    evt?.preventDefault();
    this.phaseValue = Math.max(0, Math.min(this.progress.length - 1, isNaN(this.phaseValue) ? 0 : this.phaseValue));
    GLOBALS.user.eventConfig.progressIdx = this.phaseValue;
    this.editField = null;
    GLOBALS.saveSharedData();
  }

  protected saveEventCount(evt?: PointerEvent) {
    evt?.preventDefault();
    this.eventCount = Math.max(0, Math.min(999, isNaN(this.eventCount) ? 0 : this.eventCount));
    GLOBALS.user.eventConfig.eventCount = this.eventCount;
    GLOBALS.user.eventConfig.progressIdx = 0;
    this.editField = null;
    GLOBALS.saveSharedData();
  }

  protected clickEventCount(evt: PointerEvent) {
    evt?.preventDefault();
    this.eventCount = GLOBALS.user.eventConfig.eventCount;
    this.editField = 'eventCount';
    GLOBALS.saveSharedData();
  }

  protected clickHelp(evt: PointerEvent, idx: number) {
    evt.preventDefault();
    this.msg.showPopup(HelpComponent, 'help', {
      title: `event${idx}`
    });
  }
}

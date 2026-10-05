import {Component} from '@angular/core';
import {GLOBALS, GlobalsService} from '@/_services/globals.service';
import {EventService} from '@/_services/event.service';
import {MessageService} from '@/_services/message.service';
import {DomSanitizer} from '@angular/platform-browser';
import {EventTownData} from '@/_model/event-place-data';
import {Utils} from '@/classes/utils';
import {EventData} from '@/_model/event-data';
import {EventTimerComponent} from '@/components/events/components/fellowship/event-timer/event-timer.component';

@Component({
  selector: 'app-fellowship',
  standalone: false,
  templateUrl: './fellowship.component.html',
  styleUrl: './fellowship.component.scss',
})
export class FellowshipComponent {
  editField: string;
  phaseValue: number;
  eventCount: number;
  tasks: string[] = [$localize`1. Aufgabe`, $localize`2. Aufgabe`, $localize`3. Aufgabe`];
  townsForTasks: { label: string, idx: number[], town: number }[];
  taskLimit: number;
  taskNumbers = Array(38);

  constructor(public globals: GlobalsService,
              public eventSrv: EventService,
              public msg: MessageService,
              public sanitizer: DomSanitizer) {
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

  get taskEdits() {
    const ret: number[] = [];
    let lastIdx: number;
    for (let i = 0; i < this.tasks.length; i++) {
      const key = this.tasks[i];
      if (this.event.tasks?.[key] != null) {
        ret.push(i);
      } else if (lastIdx == null) {
        lastIdx = i;
      }
    }
    if (this.townsForTasks?.length !== 1 && lastIdx != null) {
      ret.push(lastIdx);
    }
    if (ret.length === 0) {
      ret.push(0);
    }
    return ret;
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

  taskKeys(idx: number) {
    return Object.keys(this.event?.tasks)
      .filter((key) => {
        for (let i = 0; i < this.taskEdits.length; i++) {
          if (i !== idx && this.tasks[i] === key) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => a.localeCompare(b));
  }

  townIdxForCount(round: number) {
    if (round === 0) {
      return 0;
    }
    return round % (this.event.towns.length - 1) + 1;
  }

  setTaskLimit(limit: number) {
    this.taskLimit = limit;
    this.setTask();
  }

  setTask(idx?: number, key?: string) {
    if (idx >= 0) {
      if (key != null) {
        this.tasks[idx] = key;
      } else {
        this.tasks[idx] = $localize`${idx + 1}. Aufgabe`;
      }
    }
    // list of task-indices selected by the user
    const taskKeyList = this.taskEdits;
    // this.tasks = ['150 Gebäude verbessern', 'Bauernhof-Aufseher 3', 'Gewürzladen 200'];
    // count of tasks accomplished by the user
    const limit = this.taskLimit ?? 10000;
    const townCount = this.event.towns.length - 1;
    // the list with results for every selected task
    const result: { count: number, idx: number[][], town: number[] }[] = [];
    // the minimum number of matches to calculate the town
    let minMatch = 0;
    for (let i = 0; i < taskKeyList.length; i++) {
      if (this.event.tasks[this.tasks[taskKeyList[i]]] != null) {
        minMatch++;
      }
      result.push({count: 0, idx: [], town: []});
    }
    this.townsForTasks = [];
    for (const task of taskKeyList) {
      for (let i = 0; i < townCount; i++) {
        if ((this.event.tasks[this.tasks[task]]?.[i] ?? []).length > 0) {
          let check = this.event.tasks[this.tasks[task]][i]
            .filter((x) => x < limit + 3);
          if (check.length > 0) {
            result[task].count++;
            result[task].idx.push(check);
            result[task].town.push(i);
          }
        }
      }
    }
    let ret: any[] = [];
    if (minMatch > 0) {
      for (let i = 0; i < this.event.towns.length; i++) {
        const check = result.filter(r => r.town.includes(i));
        if (check.length >= minMatch) {
          ret.push({label: `Stadt #${i + 1}`, idx: check.length, town: i});
        }
      }
    }
    this.townsForTasks = ret;
  }

  protected styleForPlace(placeIdx: number) {
    const place = this.event.places[placeIdx];
    const ret: any = {
      left: `${place.x}%`,
      top: `${place.y}%`,
    };
    if (this.placeProgress(placeIdx) === 0 && placeIdx > 1) {
      ret.display = 'none';
    }
    return ret;
  }

  protected level(placeIdx: number) {
    return this.event.places[placeIdx].levels[this.townIdxForCount(GLOBALS.user.eventConfig.eventCount)];
  }

  protected classForPlace(placeIdx: number) {
    const ret: string[] = [];
    if (this.progress[GLOBALS.user.eventConfig.progressIdx]?.[0] === placeIdx) {
      ret.push('current');
      if (GLOBALS.user.eventConfig.progressIdx === this.progress.length - 1) {
        ret.push('last');
      }
    }
    return ret;
  }

  protected placeProgress(placeIdx: number) {
    let ret = null;
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
      if (GLOBALS.user.eventConfig.progressIdx === this.progress.length - 1) {
        GLOBALS.user.eventConfig.progressIdx = 0;
        GLOBALS.user.eventConfig.eventCount++;
      } else {
        GLOBALS.user.eventConfig.progressIdx++;
      }
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
    this.phaseValue = Math.max(1, Math.min(this.progress.length, isNaN(this.phaseValue) ? 0 : this.phaseValue));
    GLOBALS.user.eventConfig.progressIdx = this.phaseValue - 1;
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

  protected clickTownHelp(evt: PointerEvent) {
    evt?.preventDefault();
    this.setTask();
    this.editField = 'townHelp';
  }

  protected clickTownForTasks(evt: PointerEvent, idx: number) {
    evt?.preventDefault();
    GLOBALS.user.eventConfig.eventCount = this.townsForTasks[idx].town;
    this.editField = null;
    GLOBALS.saveSharedData();
  }

  protected clickEventTimer(evt: PointerEvent) {
    evt.preventDefault();
    this.msg.showPopup(EventTimerComponent, 'event-timer', {});
  }
}

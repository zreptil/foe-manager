import {Component, Inject, OnInit} from '@angular/core';
import {DlgBaseComponent} from '@/classes/base/dlg-base-component';
import {GLOBALS, GlobalsService} from '@/_services/globals.service';
import {EnvironmentService} from '@/_services/environment.service';
import {MessageService} from '@/_services/message.service';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer} from '@angular/platform-browser';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {DialogData} from '@/_model/dialog-data';
import {CloseButtonData} from '@/controls/close-button/close-button-data';
import {Utils} from '@/classes/utils';

@Component({
  selector: 'app-event-timer',
  standalone: false,
  templateUrl: './event-timer.component.html',
  styleUrl: './event-timer.component.scss',
})
export class EventTimerComponent extends DlgBaseComponent implements OnInit {
  closeData: CloseButtonData = {
    viewInfo: this.name,
    colorKey: 'help',
    showClose: true
  };
  timerStart: number;
  timerEnd: number;
  org = {timerStart: 0, timerEnd: 0};
  durationText: string;
  endTimeText: string;
  timerHandle: NodeJS.Timeout;

  constructor(globals: GlobalsService,
              public env: EnvironmentService,
              public msg: MessageService,
              public http: HttpClient,
              public sanitizer: DomSanitizer,
              private dialogRef: MatDialogRef<EventTimerComponent>,
              @Inject(MAT_DIALOG_DATA) public data: DialogData) {
    super(globals, 'EventTimer');
  }

  get bankett() {
    return GLOBALS.user.timer.bankett;
  }

  set bankett(value) {
    this.updateTimer();
    GLOBALS.user.timer.bankett = value;
  }

  get target() {
    return GLOBALS.user.timer.target;
  }

  set target(value) {
    this.updateTimer();
    GLOBALS.user.timer.target = value;
  }

  get goods() {
    return GLOBALS.user.timer.goods;
  }

  set goods(value) {
    this.updateTimer();
    GLOBALS.user.timer.goods = value;
    GLOBALS.saveSharedData();
  }

  get timerText() {
    if (this.timerStart == null) {
      return null;
    } else if (this.timerEnd == null) {
      return 'läuft...';
    } else {
      return this.fmtTime((this.timerEnd - this.timerStart) / 1000, true);
    }
  }

  get timerIcon() {
    if (this.timerStart == null) {
      return 'play_arrow';
    } else if (this.timerEnd == null) {
      return 'stop';
    } else {
      return 'replay';
    }
  }

  get timerLabel() {
    if (this.timerStart == null) {
      return $localize`Start Timer`;
    } else if (this.timerEnd == null) {
      return $localize`Stop Timer`;
    } else {
      return $localize`Reset Time`;
    }
  }

  updateTimer() {
    if (GLOBALS.user.timer.goods != null && this.timerEnd != null && this.timerStart != null) {
      const diff = Date.now() - this.timerEnd;
      this.timerStart = this.org.timerStart + diff;
      this.timerEnd = this.org.timerEnd + diff;
    }
  }

  calcTimer(bankett: string, current: string, target: string, time: number, useCurrentTime = false) {
    const vBankett = this.cvtEvtNumber(bankett);
    const vCurrent = this.cvtEvtNumber(current);
    const vTarget = this.cvtEvtNumber(target);
    const count = Math.ceil((vTarget - vCurrent) / vBankett);
    time = count * time / 1000;
    if (useCurrentTime) {
      time -= (Date.now() - this.timerStart) / 1000;
    }
    if (time <= 0) {
      this.dialogRef.addPanelClass('alert');
    } else {
      this.dialogRef.removePanelClass('alert');
    }
    const date = new Date(Date.now() + time * 1000);
    const endTime =
      date.getHours() * 3600 +
      date.getMinutes() * 60 +
      date.getSeconds();
    return {
      duration: this.fmtTime(time < 0 ? 0 : time),
      endTime: this.fmtTime(endTime < 0 ? 0 : endTime, false, true) + ' Uhr'
    };
  }

  calcDuration(current = false) {
    if (this.timerStart != null
      && this.timerEnd != null
      && this.bankett != null
      && this.goods != null
      && this.target != null) {
      const time = this.timerEnd - this.timerStart;
      return this.calcTimer(this.bankett, this.goods, this.target, time, current);
    }
    return '';
  }

  ngOnInit(): void {
  }

  fmtTime(seconds: number, withMillis = false, asTime = false) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ret: string[] = [];
    if (h > 0) {
      ret.push(asTime ? `${h}` : `${h} Std`);
    }
    if (m > 0 || h > 0) {
      ret.push(asTime ? `${m}` : `${m} Min`);
    }
    if (!asTime) {
      if (withMillis) {
        ret.push(`${(seconds % 60 % 1000)} Sec`);
      } else {
        ret.push(`${s} Sec`);
      }
    }

    return Utils.join(ret, asTime ? ':' : ' ');
  }

  cvtEvtNumber(value: string) {
    const multipliers: any = {
      'K': 1000,
      'M': 1000000,
      'B': 1000000000,
      'T': 1000000000000,
      'Q': 1000000000000000,
    };
    const lastChar = value.charAt(value.length - 1)?.toUpperCase();
    if (multipliers[lastChar] != null) {
      return parseFloat(value.slice(0, -1)) * multipliers[lastChar];
    }
    return parseFloat(value);
  }

  timerStep() {
    clearTimeout(this.timerHandle);
    this.timerHandle = setTimeout(() => {
      this.timerStep();
    }, 1000);
    const temp: any = this.calcDuration(true);
    this.durationText = temp?.duration;
    this.endTimeText = temp?.endTime;
  }

  protected clickTimer(evt: PointerEvent) {
    evt.stopPropagation();
    if (this.timerStart == null) {
      this.timerStart = Date.now();
      this.org.timerStart = this.timerStart;
    } else if (this.timerEnd == null) {
      this.timerEnd = Date.now();
      this.org.timerEnd = this.timerEnd;
      GLOBALS.saveSharedData();
      this.timerStep();
    } else {
      this.timerStart = null;
      this.timerEnd = null;
      this.org.timerStart = null;
      this.org.timerEnd = null;
    }
  }
}

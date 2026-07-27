import {Component} from '@angular/core';
import {HistoryBase} from './history-base';
import {MatIcon} from '@angular/material/icon';
import {GLOBALS} from '@/_services/globals.service';

@Component({
  selector: 'app-v104',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="added" i18n="104a1">
      Die Gebäude wurden mit Icons versehen, die anzeigen, welchen Bonus sie hauptsächlich
      gewähren:<br>
      <div list>
        <mat-icon>{{ globals.ICON_FIGHT }}</mat-icon>
        <span>Bonus für Kampf</span>
      </div>
      <div list>
        <mat-icon>{{ globals.ICON_GOODS }}</mat-icon>
        <span>Erzeugt Resourcen</span>
      </div>
      <div list>
        <mat-icon>{{ globals.ICON_FORGE }}</mat-icon>
        <span>Erzeugt Forgepunkte</span>
      </div>
      <div list>
        <mat-icon>{{ globals.ICON_PEOPLE }}</mat-icon>
        <span>Erzeugt Bevölkerung</span>
      </div>
    </li>
  </ul>
  `,
  imports: [
    MatIcon
  ],
  standalone: true
})
export class V104 extends HistoryBase {
  data = [104, 20260727];
  protected readonly globals = GLOBALS;
}

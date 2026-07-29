import {Component} from '@angular/core';
import {HistoryBase} from './history-base';
import {MatIcon} from '@angular/material/icon';
import {GLOBALS} from '@/_services/globals.service';

@Component({
  selector: 'app-v108',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="added" i18n="108a1">
      Ein Icon zur Kennzeichnung von Gebäuden, die zur Gildenkasse beitragen wurde hinzugefügt.
      Hier die vollständige Liste:<br>
      <div list>
        <mat-icon>{{ globals.ICON_FIGHT }}</mat-icon>
        <span>Bonus für Kampf</span>
      </div>
      <div list>
        <mat-icon>{{ globals.ICON_GOODS }}</mat-icon>
        <span>Erzeugt Resourcen</span>
      </div>
      <div list>
        <mat-icon>{{ globals.ICON_GUILD }}</mat-icon>
        <span>Erzeugt Ressourcen für die Gildenkasse</span>
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
export class V108 extends HistoryBase {
  data = [108, 20260729];
  protected readonly globals = GLOBALS;
}

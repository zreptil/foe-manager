import {Component} from '@angular/core';
import {HistoryBase} from './history-base';
import {GLOBALS} from '@/_services/globals.service';

@Component({
  selector: 'app-v105',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="added" i18n="105a1">
      Die Effekte der Gebäude wurden hinzugefügt. Diese werden in der Gebäudeübersicht und
      in der Auswahl der Gebäude für die eigene Stadt angezeigt.
    </li>
  </ul>
  `,
  imports: [],
  standalone: true
})
export class V105 extends HistoryBase {
  data = [105, 20260727];
  protected readonly globals = GLOBALS;
}

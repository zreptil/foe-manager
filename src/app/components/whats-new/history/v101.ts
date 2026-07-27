import {Component} from '@angular/core';
import {HistoryBase} from './history-base';

@Component({
  selector: 'app-v101',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="added" i18n="101f2">
      Laden der Daten korrigiert.
    </li>
    <li class="added" i18n="101f1">
      Berechnung des Eigenanteils korrigiert.
    </li>
  </ul>
  `,
  standalone: true
})
export class V101 extends HistoryBase {
  data = [101, 20260721];
}

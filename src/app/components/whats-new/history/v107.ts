import {Component} from '@angular/core';
import {HistoryBase} from './history-base';
import {GLOBALS} from '@/_services/globals.service';

@Component({
  selector: 'app-v107',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="changed" i18n="107c1">
      Der Eigenanteil für die komplette Sicherung aller Plätze wird jetzt oberhalb der
      Belohnungen für die Plätze angezeigt. Neben den Plätzen steht nach wie vor der
      Eigenanteil für die Sicherung des jeweiligen Platzes.
    </li>
  </ul>
  `,
  imports: [],
  standalone: true
})
export class V107 extends HistoryBase {
  data = [108, 20260728];
  protected readonly globals = GLOBALS;
}

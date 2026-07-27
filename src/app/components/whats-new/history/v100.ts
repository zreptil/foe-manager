import {Component} from '@angular/core';
import {HistoryBase} from './history-base';

@Component({
  selector: 'app-v100',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="added" i18n="100a1">
      Erste Version, alles ist neu!
    </li>
  </ul>
  `,
  standalone: true
})
export class V100 extends HistoryBase {
  data = [100, 20260720];
}

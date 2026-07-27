import {Component} from '@angular/core';
import {HistoryBase} from './history-base';

@Component({
  selector: 'app-v103',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="added" i18n="103a1">
      Dieses Popup hinzugefügt, um über Versionsänderungen zu informieren.
    </li>
    <li class="changed" i18n="103c2">
      Die Markierung der Gebäude kann nun in verschiedenen Farben erfolgen.
    </li>
  </ul>
  `,
  standalone: true
})
export class V103 extends HistoryBase {
  data = [103, 20260721];
}

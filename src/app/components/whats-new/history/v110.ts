import {Component} from '@angular/core';
import {HistoryBase} from './history-base';
import {GLOBALS} from '@/_services/globals.service';

@Component({
  selector: 'app-v110',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="changed" i18n="110c1">
      Die Anzeige der Spalten für die Einzahlungen wurde verbessert. Es gibt jetzt für
      jede Spalte eine Spalte mit dem benötigen Eigenanteil, um den Wert abzusichern.
    </li>
  </ul>
  `,
  imports: [],
  standalone: true
})
export class V110 extends HistoryBase {
  data = [110, 20260729];
  protected readonly globals = GLOBALS;
}

import {Component} from '@angular/core';
import {HistoryBase} from './history-base';
import {GLOBALS} from '@/_services/globals.service';

@Component({
  selector: 'app-v109',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="added" i18n="109a1">
      Es ist nun möglich, bei der Editierung eines eigenen Gebäudes festzulegen,
      welche Spalte für die Kopie verwendet werden soll. Die entsprechende Spalte
      wird mit einem Rahmen markiert und dann auch auf der Übersichtsseite der
      eigenen Gebäude entsprechend angezeigt. Aktiviert wird die Spalte, indem
      die Zeile oberhalb der P1-Zeile angeklickt wird. Die Spalte wird wieder
      auf den Standard zurückgesetzt, wenn der Level geändert wird. Dabei werden
      auch der eingegebene Eigenanteil und die Fremdanteile gelöscht.
    </li>
  </ul>
  `,
  imports: [],
  standalone: true
})
export class V109 extends HistoryBase {
  data = [109, 20260729];
  protected readonly globals = GLOBALS;
}

import {Component} from '@angular/core';
import {HistoryBase} from './history-base';
import {GLOBALS} from '@/_services/globals.service';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-v106',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="added" i18n="106a1">
      In der Liste der Gebäude in der Stadt kann man jetzt über das Menü, das zur Farbwahl dient,
      mit Anklicken des letzten Punktes in den Eingabemodus für dieses Gebäude wechseln. Hier kann
      man wie in der Gebäudeliste Eigenanteil und Fremdanteile eingeben. Mit Anklicken des Pfeils
      links oben kommt man wieder in die Liste der Gebäude in der Stadt zurück.
    </li>
    <li class="added" i18n="106a2">
      Neue Sortierung der Gebäudeliste.
      <div list>
        <mat-icon>{{ globals.ICON_FIGHT }}</mat-icon>
        <span>Sortierung nach der Art des Gebäudes</span>
      </div>
    </li>
  </ul>
  `,
  imports: [
    MatIcon
  ],
  standalone: true
})
export class V106 extends HistoryBase {
  data = [106, 20260728];
  protected readonly globals = GLOBALS;
}

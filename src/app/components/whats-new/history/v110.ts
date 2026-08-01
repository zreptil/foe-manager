import {Component} from '@angular/core';
import {HistoryBase} from './history-base';
import {GLOBALS} from '@/_services/globals.service';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-v110',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="added" i18n="110a1">
      In der Titelleiste gibt es rechts oben einen Button, mit dem man die Informationen
      zu den Gebäuden ein- und ausblenden kann.
    </li>
    <li class="added" i18n="110a2">
      Es gibt neue Icons für die Gbäude. Es werden jetzt auch bis zu zwei Icons für jedes Gebäude
      angezeigt. Eins links und eins rechts. Hier die vollständige Liste der Icons:
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
      <div list>
        <mat-icon>{{ globals.ICON_MONEY }}</mat-icon>
        <span>Erzeugt Geld</span>
      </div>
      <div list>
        <mat-icon>{{ globals.ICON_HAPPY }}</mat-icon>
        <span>Erhöht die Zufriedenheit</span>
      </div>
      <div list>
        <mat-icon>{{ globals.ICON_PROTECT }}</mat-icon>
        <span>Chance, einen Plünderungsversuch abzuwehren</span>
      </div>
      <div list>
        <mat-icon>{{ globals.ICON_MEDALS }}</mat-icon>
        <span>Erzeugt Medaillen</span>
      </div>
      <div list>
        <mat-icon>{{ globals.ICON_TOWNGOODS }}</mat-icon>
        <span>Erhöht die Vorratsproduktion in der Stadt</span>
      </div>
      <div list>
        <mat-icon>{{ globals.ICON_ARMY }}</mat-icon>
        <span>Erzeugt Einheiten</span>
      </div>
      <div list>
        <mat-icon>{{ globals.ICON_BAG }}</mat-icon>
        <span>Bonus auf diverse Ressourcen</span>
      </div>
      <div list>
        <mat-icon>{{ globals.ICON_DOUBLE }}</mat-icon>
        <span>Doppelter Bonus auf diverse Ressourcen</span>
      </div>
      <div list>
        <mat-icon>{{ globals.ICON_REWARD }}</mat-icon>
        <span>Erhöhung des Mäzenbonus</span>
      </div>
    </li>
    <li class="changed" i18n="110c1">
      Die Anzeige der Spalten für die Einzahlungen wurde verbessert. Es gibt jetzt für
      jede Spalte eine Spalte mit dem benötigen Eigenanteil, um den Wert abzusichern.
    </li>
  </ul>
  `,
  imports: [
    MatIcon
  ],
  standalone: true
})
export class V110 extends HistoryBase {
  data = [110, 20260729];
  protected readonly globals = GLOBALS;
}

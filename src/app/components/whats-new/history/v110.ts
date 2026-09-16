import {Component} from '@angular/core';
import {HistoryBase} from './history-base';
import {GLOBALS} from '@/_services/globals.service';
import {MatIcon} from '@angular/material/icon';
import {EnumSortmode} from '@/_model/user-data';

@Component({
  selector: 'app-v110',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="added" i18n="110a10">
      Bei der Farbauswahl kann man jetzt die Farbe festlegen, die gesetzt werden soll, wenn man den
      Text kopiert. Man schaltet das um, indem man die gleiche Farbe anklickt, die gerade beim Gebäude
      hinterlegt ist. Die Icons auf den Farben haben folgende Bedeutung:
      <div list>
        <mat-icon>done</mat-icon>
        wird für die aktuelle Farbe angezeigt
      </div>
      <div list>
        <mat-icon>content_copy</mat-icon>
        wird angezeigt, wenn die Farbe beim Kopieren des Textes gesetzt wird
      </div>
      <div list>
        <mat-icon>difference</mat-icon>
        wird angezeigt, wenn die Farbe beim Kopieren des Textes gesetzt wird und es sich um die aktuelle Farbe handelt
      </div>
    </li>
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
    <li class="added" i18n="110a3">
      Es gibt jetzt eine Option, um die Pfeile für die Änderung des Levels ein- und auszuschalten.
      Diese befindet sich im neuen Einstellungsmenü rechts oben.
    </li>
    <li class="changed" i18n="110c2">
      Die Sortierung wird jetzt über ein Menü gesteuert. Das wird über den gleichen Button
      wie bisher aufgerufen. Die Sortierung kann dann durch Anklicken der Sortierbuttons
      festgelegt werden. Durch erneutes Anklicken des Buttons wird die Sortierung umgedreht.
    </li>
    <li class="added" i18n="110a4">
      Bei der Sortierung gibt es jetzt die Option, die Sortierung selbst vorzunehmen. Wenn dieser
      Modus aktiviert ist, kann die Sortierung durch Anklicken der Pfeile am unteren Rand der
      Gebäude vorgenommen werden, die statt des Kopierbuttons angezeigt werden. Wenn die Option
      für die eigene Sortierung nochmal angeklickt wird, wird die Reihenfolge festgesetzt und
      die Kopierung der Gebäude wieder ermöglicht.
    </li>
    <li class="added" i18n="110a5">
      Im Editmodus der eigenen Gebäude ist es nun möglich die Spalte, die kopiert werden soll,
      mit dem Button <b>"Spalte" absichern</b> mit den Werten für die Absicherung aller Plätze
      zu versehen. Dabei werden die Fremdanteile eingetragen und der Eigenanteil entsprechend
      berechnet und auch eingetragen. Der Button ist nur verfügbar, wenn eine andere Spalte
      als die erste ausgewählt wurde.
    </li>
    <li class="changed" i18n="110c1">
      Die Anzeige der Spalten für die Einzahlungen wurde verbessert. Es gibt jetzt für
      jede Spalte eine Spalte mit dem benötigen Eigenanteil, um den Wert abzusichern.
    </li>
    <li class="changed" i18n="110c3">
      Die Buttons für die Umschaltung des Zooms und der Gebäudeinfo wurden in das
      Einstellungsmenü verschoben. Das Aussehen des Buttons für die Umschaltung
      der Level Pfeile wurde an die anderen Buttons angepasst.
    </li>
    <li class="changed" i18n="110c4">
      Das Icon für die Umschaltung zur Auswahl der Gebäude für die Stadt wurde geändert.
    </li>
    <li class="changed" i18n="110c5">
      Die eigene Sortierung wurde korrigiert und mit zusätzlichen Buttons versehen, die das
      entsprechende Gebäude an den Anfang oder das Ende verschieben.
    </li>
    <li class="added" i18n="110a6">
      In der Spalte der Eigenanteile wird bei Auswahl der 1,9er Spalte jetzt auch an, was noch
      vom Eigenanteil fehlt, wenn er noch nicht dem benötigten Eigenanteil zur Absicherung von
      P1 bis P5 entspricht.
    </li>
    <li class="added" i18n="110a7">
      Bei der Editierung von Gebäuden kann jetzt mit Navigationsbuttons rechts und links durch
      die Liste der Gebäude geblättert werden.
    </li>
    <li class="added" i18n="110a8">
      Es gibt eine neue Option <span bold>Level Farbe zurücksetzen</span>. Wenn diese aktiviert ist, dann
      wird beim Ändern des Levels eines Gebäudes die Farbe auf den Standardwert zurückgesetzt. Ausserdem
      werden alle Plätze markiert.
    </li>
    <li class="added" i18n="110a9">
      <div line>
        Es gibt eine neue Sortierung namens&nbsp;<span bold>Zeitalter</span>. Diese wird mit dem Icon
        <mat-icon>{{ globals.iconForSort(EnumSortmode.epoch) }}</mat-icon>
        dargestellt.
      </div>
      Diese Sortierung funktioniert ähnlich wie die eigene Sortierung. Wenn man sie anklickt,
      wird zunächst die Sortierung aktiviert. Dann kann man mit kleinen Pfeilchen links und rechts der
      Zeitalterbezeichnungen die Sortierung ändern. Wenn man in diesem Modus das Zeitalter selbst anklickt,
      wird es an die erste Stelle gesetzt.
      <div line>Beim ersten und letzten Zeitalter gibt es einen Button, der so aussieht:&nbsp;
        <mat-icon>format_list_numbered</mat-icon>
      </div>
      Wenn man diesen Button anklickt, werden die Zeitalter so sortiert, wie sie im Spiel vorkommen.
      Wenn man im Sortierungsmenü die Option mit der Zeitalter Sortierung noch einmal anklickt, wird
      die Sortierung fixiert und kann erst dann wieder geändert werden, wenn man diese Option erneut
      anklickt.
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
  protected readonly EnumSortmode = EnumSortmode;
}

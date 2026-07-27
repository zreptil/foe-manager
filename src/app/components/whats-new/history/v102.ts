import {Component} from '@angular/core';
import {HistoryBase} from './history-base';

@Component({
  selector: 'app-v102',
  template: `<h2 [innerHTML]="version"></h2>
  <ul>
    <li class="added" i18n="102a1">
      Dieses Popup hinzugefügt, um über Versionsänderungen zu informieren.
    </li>
    <li class="added" i18n="102a2">
      Im Gebäudemodus gibt es nun zwei Spalten. Eine heisst "Sicher" und eine "Nett". In der Spalte sicher
      werden die Einzahlungen angezeigt, die benötigt werden, um die jeweiligen Plätze zu sichern. Dabei
      werden der Eigenanteil und auch die Fremdanteile berücksichtigt. In der Spalte "Nett" werden
      die Einzahlungen so berechnet, dass die verbleibenden Plätze nach den eingezahlten Fremdanteilen
      möglichst ohne Verlust belegt werden können. Der Ausgangswert für die Spalte ist immer der Eigenanteil,
      der benötigt wird, um Platz 1 zu sichern. In beiden Spalten ist die Farbkodierung die gleiche.
      Rot bedeutet, dass auf dem Platz mehr eingezahlt wird, als es Belohnung dafür gibt. Grün bedeutet,
      die Belohnung ist gleich oder grösser als die Einzahlung.
    </li>
    <li class="fixed" i18n="102f1">
      Speicherung der Gebäudedaten korrigiert.
    </li>
    <li class="changed" i18n="102c1">
      Die Basisdaten komprimiert und von Ballast befreit.
    </li>
  </ul>
  `,
  standalone: true
})
export class V102 extends HistoryBase {
  data = [102, 20260721];
}

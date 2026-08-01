import {Injectable} from '@angular/core';
import {GbData} from '@/_model/gb-data';
import {LevelData} from '@/_model/level-data';
import {HttpClient, HttpRequest} from '@angular/common/http';
import {GLOBALS} from './globals.service';

@Injectable({
  providedIn: 'root',
})
export class AssistService {
  assistVersion = '1.1';
  gbVersion: string;
  gbList: GbData[];
  importDone = false;
  loadDone = false;

  constructor(public http: HttpClient) {
  }

  get hasData() {
    return this.gbVersion === this.assistVersion;
  }

  loadFromAsset(onDone?: (data: any) => void) {
    const req = new HttpRequest(
      'GET',
      `assets/gb-data.json?v=${GLOBALS.version}`,
      null,
      {responseType: 'json'});
    let body: any;
    this.loadDone = false;
    this.http.request(req).subscribe({
      next: (data: any) => {
        body = data;
      }, error: (err) => {
        console.error(err);
      }, complete: () => {
        const response = body.body;
        this.gbVersion = response?.version;
        this.initData();
        if (this.gbVersion === this.assistVersion) {
          const list = response.list;
          for (const src of list) {
            const gb = this.gbList.find((gb) => gb.key === src.a);
            if (gb != null) {
              gb.fillFromJson(src, gb);
            } else {
              console.error(`Unknown GB: ${src.a}`);
            }
            // this.gbList.push(new GbData(src));
          }
        }
        if (GLOBALS.mayDebug) {
          this.gbList.push(new GbData({
            '0': this.gbList.length,
            'a': '_Test100',
            'b': '_Test 100',
            'c': [{'0': 1, 'a': 1, 'b': 200, 'c': [25, 20, 15, 10, 5], 'd': [null, null, null, null, null], 'e': 10, 'f': 10, 'g': 10},
              {'0': 2, 'a': 2, 'b': 100, 'c': [20, 17, 9, 7, 3], 'd': [null, null, null, null, null], 'e': 10, 'f': 10, 'g': 10}]
          }));
        }
        this.loadDone = true;
        onDone?.(this.gbList);
      }
    });
  }

  initData() {
    this.gbList = [
      new GbData({
        a: 'Cosmic-Catalyst', b: 'Kosmischer Katalysator',
        d: [{key: GLOBALS.ICON_FIGHT}, {key: GLOBALS.ICON_GUILD}],
        e: [
          $localize`Chance, einer gegnerischen Einheit des selben Zeitalters 150% Schaden zuzufügen`,
          $localize`Produziert Güter für die Gildenkasse`,
          $localize`Spezialbonus des Kosmischen Katalysators`
        ]
      }),
      new GbData({
        a: 'Stellar-Warship', b: 'Stellares Kriegsschiff',
        d: [{key: GLOBALS.ICON_FIGHT, class: 'attackdefend'}, {key: GLOBALS.ICON_ARMY}],
        e: [
          $localize`Erhöht die Kampfwerte der angreifenden und verteidigenden Armee`,
          $localize`Produziert ungebundene Einheiten aus vorhandenen Militärgebäuden`
        ]
      }),
      new GbData({
        a: 'Saturn-VI-Gate-HYDRA', b: 'Saturn VI Gate HYDRA',
        d: [{key: GLOBALS.ICON_FIGHT, class: 'attackdefend'}, {key: GLOBALS.ICON_GUILD}],
        e: [
          $localize`Erhöht die Kampfwerte der angreifenden und verteidigenden Armee`,
          $localize`Produziert Güter für die Gildenkasse`
        ]
      }),
      new GbData({
        a: 'Saturn-VI-Gate-PEGASUS', b: 'Saturn VI Gate PEGASUS',
        d: [{key: GLOBALS.ICON_FIGHT, class: 'defend'}, {key: GLOBALS.ICON_FORGE}],
        e: [
          $localize`Erhöht die Kampfwerte der verteidigenden Armee`,
          $localize`Produziert Forge-Punkte`
        ]
      }),
      new GbData({
        a: 'Saturn-VI-Gate-CENTAURUS', b: 'Saturn VI Gate CENTAURUS',
        d: [{key: GLOBALS.ICON_FIGHT, class: 'attack'}, {key: GLOBALS.ICON_GOODS}],
        e: [
          $localize`Erhöht die Kampfwerte der angreifenden Armee`,
          $localize`Produziert Güter der vorherigen Epoche`
        ]
      }),
      new GbData({
        a: 'AI-Core', b: 'K.I. Kern',
        d: [{key: GLOBALS.ICON_GUILD}],
        e: [
          $localize`Produziert Güter für die Gildenkasse`,
          $localize`Spezialbonus des KI-Kerns`
        ]
      }),
      new GbData({
        a: 'Flying-Island', b: 'Fliegende Insel',
        d: [{key: GLOBALS.ICON_GOODS}],
        e: [
          $localize`Ermöglicht den Fund besonderer Scherben beziehungsweise Belohnungen`
        ]
      }),
      new GbData({
        a: 'Space-Carrier', b: 'Weltraumfrachter',
        d: [{key: GLOBALS.ICON_GOODS}, {key: GLOBALS.ICON_GOODS}],
        e: [
          $localize`Gewährt zusätzliche Belohnungen bei erfolgreichen Verhandlungen`,
          $localize`Ermöglicht den Transfer spezieller Ressourcen`
        ]
      }),
      new GbData({
        a: 'The-Virgo-Project', b: 'Virgo Projekt',
        d: [{key: GLOBALS.ICON_FIGHT}, {key: GLOBALS.ICON_MONEY}],
        e: [
          $localize`Chance, zu Kampfbeginn gegnerische Einheiten auszuschalten`,
          $localize`Produziert Münzen`
        ]
      }),
      new GbData({
        a: 'Star-Gazer', b: 'Star Gazer', d: [{key: GLOBALS.ICON_GOODS}], e: [
          $localize`Produziert Güter der vorherigen Epoche`
        ]
      }),
      new GbData({
        a: 'Terracotta-Army', b: 'Terrakotta Armee',
        d: [{key: GLOBALS.ICON_FIGHT, class: 'attackdefend'}],
        e: [
          $localize`Erhöht die Kampfwerte der angreifenden und verteidigenden Armee`
        ]
      }),
      new GbData({
        a: 'Himeji-Castle', b: 'Burg Himeji',
        d: [{key: GLOBALS.ICON_GOODS}, {key: GLOBALS.ICON_GOODS}],
        e: [
          $localize`Chance auf eine zusätzliche Belohnung nach gewonnenen Kämpfen`,
          $localize`Produziert Vorräte`
        ]
      }),
      new GbData({
        a: 'Atlantis-Museum', b: 'Atlantis Museum',
        d: [{key: GLOBALS.ICON_GOODS}, {key: GLOBALS.ICON_BAG}],
        e: [
          $localize`Produziert Güter der aktuellen Epoche`,
          $localize`Verbessert die Erträge beim Plündern`
        ]
      }),
      new GbData({
        a: 'The-Kraken', b: 'Der Kraken',
        d: [{key: GLOBALS.ICON_FIGHT}, {key: GLOBALS.ICON_FORGE}],
        e: [
          $localize`Chance, zu Kampfbeginn eine gegnerische Einheit auszuschalten`,
          $localize`Produziert Forge-Punkte`
        ]
      }),
      new GbData({
        a: 'The-Blue-Galaxy', b: 'Die blaue Galaxie',
        d: [{key: GLOBALS.ICON_GOODS}, {key: GLOBALS.ICON_DOUBLE}],
        e: [
          $localize`Produziert Medaillen`,
          $localize`Chance, die reguläre Produktion eines motivierten Gebäudes doppelt einzusammeln`
        ]
      }),
      new GbData({
        a: 'Gaea-Statue', b: 'Gaea-Statue',
        d: [{key: GLOBALS.ICON_MEDALS}, {key: GLOBALS.ICON_HAPPY}],
        e: [
          $localize`Produziert Medaillen`,
          $localize`Erhöht die Zufriedenheit der Stadt`
        ]
      }),
      new GbData({
        a: 'Arctic-Orangery', b: 'Arktische Orangerie',
        d: [{key: GLOBALS.ICON_FIGHT}, {key: GLOBALS.ICON_FORGE}],
        e: [
          $localize`Chance, einer gegnerischen Einheit des selben Zeitalters 150% Schaden zuzufügen`,
          $localize`Produziert Forge-Punkte`
        ]
      }),
      new GbData({
        a: 'Seed-Vault', b: 'Saatgut-Tresor',
        d: [{key: GLOBALS.ICON_GOODS}, {key: GLOBALS.ICON_BAG}],
        e: [
          $localize`Produziert Vorräte`,
          $localize`Chance auf Güter oder andere Belohnungen beim Motivieren beziehungsweise Polieren`
        ]
      }),
      new GbData({
        a: 'Rain-Forest-Project', b: 'Regenwald-Projekt',
        d: [{key: GLOBALS.ICON_GOODS}, {key: GLOBALS.ICON_BAG}],
        e: [
          $localize`Produziert Güter der aktuellen Epoche`,
          $localize`Erhöht die Chance auf Blaupausen beim Motivieren beziehungsweise Polieren`
        ]
      }),
      new GbData({
        a: 'The-Arc', b: 'Die Arche',
        d: [{key: GLOBALS.ICON_GUILD}, {key: GLOBALS.ICON_REWARD}],
        e: [
          $localize`Produziert Güter für die Gildenkasse`,
          $localize`Erhöht Belohnungen für Einzahlungen in Legendäre Gebäude`
        ]
      }),
      new GbData({
        a: 'Voyager-V1', b: 'Voyager V1',
        d: [{key: GLOBALS.ICON_GOODS}, {key: GLOBALS.ICON_BAG}],
        e: [
          $localize`Produziert Vorräte`,
          $localize`Gewährt zusätzliche Güter beim erfolgreichen Plündern`
        ]
      }),
      new GbData({
        a: 'Trust-Tower', b: 'Friedensturm',
        d: [{key: GLOBALS.ICON_GOODS}, {key: GLOBALS.ICON_BAG}],
        e: [
          $localize`Produziert Vorräte`,
          $localize`Chance auf Güter beim Motivieren beziehungsweise Polieren`
        ]
      }),
      new GbData({
        a: 'Innovation-Tower', b: 'Innovation Tower',
        d: [{key: GLOBALS.ICON_FORGE}, {key: GLOBALS.ICON_PEOPLE}],
        e: [
          $localize`Produziert Forge-Punkte`,
          $localize`Stellt Bevölkerung bereit`
        ]
      }),
      new GbData({
        a: 'Lotus-Temple', b: 'Lotustempel',
        d: [{key: GLOBALS.ICON_MONEY}, {key: GLOBALS.ICON_HAPPY}],
        e: [
          $localize`Produziert Münzen`,
          $localize`Erhöht die Zufriedenheit der Stadt`
        ]
      }),
      new GbData({
        a: 'Cape-Canaveral', b: 'Cape Canaveral',
        d: [{key: GLOBALS.ICON_FORGE}],
        e: [
          $localize`Produziert Forge-Punkte`
        ]
      }),
      new GbData({
        a: 'The-Habitat', b: 'Das Habitat',
        d: [{key: GLOBALS.ICON_MONEY}, {key: GLOBALS.ICON_PEOPLE}],
        e: [
          $localize`Produziert Münzen`,
          $localize`Stellt Bevölkerung bereit`
        ]
      }),
      new GbData({
        a: 'Space-Needle', b: 'Space Needle',
        d: [{key: GLOBALS.ICON_MONEY}, {key: GLOBALS.ICON_HAPPY}],
        e: [
          $localize`Produziert Münzen`,
          $localize`Erhöht die Zufriedenheit der Stadt`
        ]
      }),
      new GbData({
        a: 'Atomium', b: 'Atomium',
        d: [{key: GLOBALS.ICON_GUILD}, {key: GLOBALS.ICON_HAPPY}],
        e: [
          $localize`Produziert Güter für die Gildenkasse`,
          $localize`Erhöht die Zufriedenheit der Stadt`
        ]
      }),
      new GbData({
        a: 'Château-Frontenac', b: 'Château Frontenac',
        d: [{key: GLOBALS.ICON_GOODS}, {key: GLOBALS.ICON_BAG}],
        e: [
          $localize`Produziert Münzen`,
          $localize`Erhöht die meisten Belohnungen aus Quests`
        ]
      }),
      new GbData({
        a: 'Alcatraz', b: 'Alcatraz',
        d: [{key: GLOBALS.ICON_ARMY}, {key: GLOBALS.ICON_HAPPY}],
        e: [
          $localize`Produziert ungebundene Einheiten aus vorhandenen Militärgebäuden`,
          $localize`Erhöht die Zufriedenheit der Stadt`
        ]
      }),
      new GbData({
        a: 'Capitol', b: 'Capitol',
        d: [{key: GLOBALS.ICON_GOODS}, {key: GLOBALS.ICON_PEOPLE}],
        e: [
          $localize`Produziert Vorräte`,
          $localize`Stellt Bevölkerung bereit`
        ]
      }),
      new GbData({
        a: 'Royal-Albert-Hall', b: 'Royal Albert Hall',
        d: [{key: GLOBALS.ICON_GOODS}, {key: GLOBALS.ICON_TOWNGOODS}],
        e: [
          $localize`Produziert Güter der aktuellen Epoche`,
          $localize`Erhöht die Vorratsproduktion der Stadt`
        ]
      }),
      new GbData({
        a: 'Deal-Castle', b: 'Deal Castle',
        d: [{key: GLOBALS.ICON_FIGHT, class: 'defend'}, {key: GLOBALS.ICON_MEDALS}],
        e: [
          $localize`Erhöht die Kampfwerte der verteidigenden Armee`,
          $localize`Produziert Medaillen`
        ]
      }),
      new GbData({
        a: 'Frauenkirche-of-Dresden', b: 'Dresdner Frauenkirche',
        d: [{key: GLOBALS.ICON_GOODS}, {key: GLOBALS.ICON_HAPPY}],
        e: [
          $localize`Produziert Güter der aktuellen Epoche`,
          $localize`Erhöht die Zufriedenheit der Stadt`
        ]
      }),
      new GbData({
        a: 'Saint-Basils-Cathedral', b: 'Basilius-Kathedrale',
        d: [{key: GLOBALS.ICON_FIGHT, class: 'defend'}, {key: GLOBALS.ICON_MONEY}],
        e: [
          $localize`Erhöht die Kampfwerte der verteidigenden Armee`,
          $localize`Produziert Münzen`
        ]
      }),
      new GbData({
        a: 'Castel-del-Monte', b: 'Castel del Monte',
        d: [{key: GLOBALS.ICON_FIGHT, class: 'attack'}, {key: GLOBALS.ICON_FORGE}],
        e: [
          $localize`Erhöht die Kampfwerte der angreifenden Armee`,
          $localize`Produziert Forge-Punkte`
        ]
      }),
      new GbData({
        a: 'St.-Marks-Basilica', b: 'Markusdom',
        d: [{key: GLOBALS.ICON_GOODS}, {key: GLOBALS.ICON_MONEY}],
        e: [
          $localize`Produziert Güter der aktuellen Epoche`,
          $localize`Erhöht die Münzproduktion der Stadt`
        ]
      }),
      new GbData({
        a: 'Notre-Dame', b: 'Notre Dame',
        d: [{key: GLOBALS.ICON_GOODS}, {key: GLOBALS.ICON_HAPPY}],
        e: [
          $localize`Produziert Vorräte`,
          $localize`Erhöht die Zufriedenheit der Stadt`
        ]
      }),
      new GbData({
        a: 'Cathedral-of-Aachen', b: 'Aachener Dom',
        d: [{key: GLOBALS.ICON_FIGHT, class: 'attack'}, {key: GLOBALS.ICON_MONEY}],
        e: [
          $localize`Erhöht die Kampfwerte der angreifenden Armee`,
          $localize`Produziert Münzen`
        ]
      }),
      new GbData({
        a: 'Hagia-Sophia', b: 'Hagia Sophia',
        d: [{key: GLOBALS.ICON_FORGE}, {key: GLOBALS.ICON_HAPPY}],
        e: [
          $localize`Produziert Forge-Punkte`,
          $localize`Erhöht die Zufriedenheit der Stadt`
        ]
      }),
      new GbData({
        a: 'Galata-Tower', b: 'Galataturm',
        d: [{key: GLOBALS.ICON_GOODS}, {key: GLOBALS.ICON_PROTECT}],
        e: [
          $localize`Produziert Güter der aktuellen Epoche`,
          $localize`Chance, einen Plünderungsversuch abzuwehren`
        ]
      }),
      new GbData({
        a: 'Colosseum', b: 'Kolosseum',
        d: [{key: GLOBALS.ICON_MEDALS}, {key: GLOBALS.ICON_HAPPY}],
        e: [
          $localize`Produziert Medaillen`,
          $localize`Erhöht die Zufriedenheit der Stadt`
        ]
      }),
      new GbData({
        a: 'Lighthouse-of-Alexandria', b: 'Leuchtturm von Alexandria',
        d: [{key: GLOBALS.ICON_GOODS}, {key: GLOBALS.ICON_TOWNGOODS}],
        e: [
          $localize`Produziert Güter der aktuellen Epoche`,
          $localize`Erhöht die Vorratsproduktion der Stadt`
        ]
      }),
      new GbData({
        a: 'Tower-of-Babel', b: 'Turm zu Babel',
        d: [{key: GLOBALS.ICON_GOODS}, {key: GLOBALS.ICON_PEOPLE}],
        e: [
          $localize`Produziert Güter der aktuellen Epoche`,
          $localize`Stellt Bevölkerung bereit`
        ]
      }),
      new GbData({
        a: 'Statue-of-Zeus', b: 'Zeusstatue',
        d: [{key: GLOBALS.ICON_FIGHT, class: 'attack'}],
        e: [
          $localize`Erhöht die Kampfwerte der angreifenden Armee`
        ]
      }),
      new GbData({
        a: 'Observatory', b: 'Observatorium',
        d: [{key: GLOBALS.ICON_FIGHT, class: 'defend'}, {key: GLOBALS.ICON_GUILD}],
        e: [
          $localize`Erhöht die Kampfwerte der verteidigenden Armee`,
          $localize`Produziert Güter für die Gildenkasse`
        ]
      }),
      new GbData({
        a: 'Oracle-of-Delphi', b: 'Orakel von Delphi',
        d: [{key: GLOBALS.ICON_GOODS}, {key: GLOBALS.ICON_HAPPY}],
        e: [
          $localize`Produziert Vorräte`,
          $localize`Erhöht die Zufriedenheit der Stadt`
        ]
      }),
      new GbData({
        a: 'Temple-of-Relics', b: 'Relikttempel',
        d: [{key: GLOBALS.ICON_GOODS}],
        e: [
          $localize`Ermöglicht Reliktfunde in der Gildenexpedition`
        ]
      }),
    ];
  }

  importData() {
    this.importDone = false;
    this.initData();
    let remaining = this.gbList.length;
    for (const gb of this.gbList) {
      this.http.get(
        `https://corg.zreptil.de?url=https://foe-assistant.com/en/gb/${gb.key}/cost/1,500,0`,
        {
          responseType: 'text'
        }
      ).subscribe(response => {
        gb.levels = [];
        for (const list of this.parseFoeTables(response)) {
          gb.levels.push(...list);
        }
        remaining--;
        if (remaining === 0) {
          this.importDone = true;
        }
      });
    }
  }

  parseFoeTables(html: string): LevelData[][] {
    const document = new DOMParser().parseFromString(html, 'text/html');
    const tables = Array.from(
      document.querySelectorAll<HTMLTableElement>('table.tabData')
    );

    return tables.map(table => {
      const rows = Array.from(
        table.querySelectorAll<HTMLTableRowElement>('tbody > tr')
      );

      return rows.map(row => this.parseRow(row));
    });
  }

  parseRow(row: HTMLTableRowElement): LevelData {
    const levelCell = row.querySelector<HTMLTableCellElement>(
      'th[scope="row"]'
    );

    const cells = Array.from(
      row.querySelectorAll<HTMLTableCellElement>(':scope > td')
    );

    if (!levelCell || cells.length < 9) {
      throw new Error('Unerwartete Tabellenstruktur');
    }

    const rewardCells = cells.slice(1, 6);
    const ret = new LevelData();
    ret.level = this.parseNumber(this.getDirectText(levelCell));
    ret.cost = this.parseNumber(this.getDirectText(cells[0]));
    ret.rewards = rewardCells.map(cell =>
      this.parseNumber(this.getDirectText(cell))
    );
    // ret.blocks = rewardCells.map(cell => {
    //   const div = cell.querySelector('div');
    //   return div
    //     ? this.parseNumber(div.textContent)
    //     : null;
    // });
    ret.ownerCost = this.parseNumber(this.getDirectText(cells[6]));
    ret.ownerPercent = this.parseNumber(this.getDirectText(cells[7]));
    ret.ownerSum = this.parseNumber(this.getDirectText(cells[8]));
    return ret;
  }

  getDirectText(element: Element): string {
    return Array.from(element.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent ?? '')
      .join(' ')
      .trim();
  }

  parseNumber(value: string | null): number {
    const normalized = (value ?? '')
      .replace('%', '')
      .replace(/\s+/g, '')
      .replace(',', '.');

    const result = Number(normalized);

    if (!Number.isFinite(result)) {
      throw new Error(`Ungültiger Zahlenwert: "${value}"`);
    }

    return result;
  }
}

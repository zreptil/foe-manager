import {Injectable} from '@angular/core';
import {GbData} from '@/_model/gb-data';
import {LevelData} from '@/_model/level-data';
import {HttpClient, HttpRequest} from '@angular/common/http';
import {GLOBALS} from './globals.service';
import {Utils} from '@/classes/utils';

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
              console.log(Utils.jsonize(gb));
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
    const ICON_FIGHT = 'swords';
    const ICON_GOODS = 'package_2';
    const ICON_FORGE = 'spoke';
    const ICON_PEOPLE = 'people';
    this.gbList = [
      new GbData({a: 'Cosmic-Catalyst', b: 'Kosmischer Katalysator', d: ICON_FIGHT}),
      new GbData({a: 'Stellar-Warship', b: 'Stellares Kriegsschiff', d: ICON_FIGHT}),
      new GbData({a: 'Saturn-VI-Gate-HYDRA', b: 'Saturn VI Gate HYDRA', d: ICON_FIGHT}),
      new GbData({a: 'Saturn-VI-Gate-PEGASUS', b: 'Saturn VI Gate PEGASUS', d: ICON_FIGHT}),
      new GbData({a: 'Saturn-VI-Gate-CENTAURUS', b: 'Saturn VI Gate CENTAURUS', d: ICON_FIGHT}),
      new GbData({a: 'AI-Core', b: 'K.I. Kern', d: ICON_GOODS}),
      new GbData({a: 'Flying-Island', b: 'Fliegende Insel', d: ICON_GOODS}),
      new GbData({a: 'Space-Carrier', b: 'Weltraumfrachter', d: ICON_GOODS}),
      new GbData({a: 'The-Virgo-Project', b: 'Virgo Projekt', d: ICON_FIGHT}),
      new GbData({a: 'Star-Gazer', b: 'Star Gazer', d: ICON_GOODS}),
      new GbData({a: 'Terracotta-Army', b: 'Terrakotta Armee', d: ICON_FIGHT}),
      new GbData({a: 'Himeji-Castle', b: 'Burg Himeji', d: ICON_GOODS}),
      new GbData({a: 'Atlantis-Museum', b: 'Atlantis Museum', d: ICON_GOODS}),
      new GbData({a: 'The-Kraken', b: 'Der Kraken', d: ICON_FIGHT}),
      new GbData({a: 'The-Blue-Galaxy', b: 'Die blaue Galaxie', d: ICON_GOODS}),
      new GbData({a: 'Gaea-Statue', b: 'Gaea-Statue', d: ICON_GOODS}),
      new GbData({a: 'Arctic-Orangery', b: 'Arktische Orangerie', d: ICON_FIGHT}),
      new GbData({a: 'Seed-Vault', b: 'Saatgut-Tresor', d: ICON_GOODS}),
      new GbData({a: 'Rain-Forest-Project', b: 'Regenwald-Projekt', d: ICON_GOODS}),
      new GbData({a: 'The-Arc', b: 'Die Arche', d: ICON_GOODS}),
      new GbData({a: 'Voyager-V1', b: 'Voyager V1', d: ICON_GOODS}),
      new GbData({a: 'Trust-Tower', b: 'Friedensturm', d: ICON_GOODS}),
      new GbData({a: 'Innovation-Tower', b: 'Innovation Tower', d: ICON_PEOPLE}),
      new GbData({a: 'Lotus-Temple', b: 'Lotustempel', d: ICON_PEOPLE}),
      new GbData({a: 'Cape-Canaveral', b: 'Cape Canaveral', d: ICON_FORGE}),
      new GbData({a: 'The-Habitat', b: 'Das Habitat', d: ICON_PEOPLE}),
      new GbData({a: 'Space-Needle', b: 'Space Needle', d: ICON_PEOPLE}),
      new GbData({a: 'Atomium', b: 'Atomium', d: ICON_GOODS}),
      new GbData({a: 'Château-Frontenac', b: 'Château Frontenac', d: ICON_GOODS}),
      new GbData({a: 'Alcatraz', b: 'Alcatraz', d: ICON_FIGHT}),
      new GbData({a: 'Capitol', b: 'Capitol', d: ICON_GOODS}),
      new GbData({a: 'Royal-Albert-Hall', b: 'Royal Albert Hall', d: ICON_GOODS}),
      new GbData({a: 'Deal-Castle', b: 'Deal Castle', d: ICON_FIGHT}),
      new GbData({a: 'Frauenkirche-of-Dresden', b: 'Dresdner Frauenkirche', d: ICON_GOODS}),
      new GbData({a: 'Saint-Basils-Cathedral', b: 'Basilius-Kathedrale', d: ICON_FIGHT}),
      new GbData({a: 'Castel-del-Monte', b: 'Castel del Monte', d: ICON_FIGHT}),
      new GbData({a: 'St.-Marks-Basilica', b: 'Markusdom', d: ICON_GOODS}),
      new GbData({a: 'Notre-Dame', b: 'Notre Dame', d: ICON_GOODS}),
      new GbData({a: 'Cathedral-of-Aachen', b: 'Aachener Dom', d: ICON_FIGHT}),
      new GbData({a: 'Hagia-Sophia', b: 'Hagia Sophia', d: ICON_FORGE}),
      new GbData({a: 'Galata-Tower', b: 'Galataturm', d: ICON_GOODS}),
      new GbData({a: 'Colosseum', b: 'Kolosseum', d: ICON_GOODS}),
      new GbData({a: 'Lighthouse-of-Alexandria', b: 'Leuchtturm von Alexandria', d: ICON_GOODS}),
      new GbData({a: 'Tower-of-Babel', b: 'Turm zu Babel', d: ICON_GOODS}),
      new GbData({a: 'Statue-of-Zeus', b: 'Zeusstatue', d: ICON_FIGHT}),
      new GbData({a: 'Observatory', b: 'Observatorium', d: ICON_FIGHT}),
      new GbData({a: 'Oracle-of-Delphi', b: 'Orakel von Delphi', d: ICON_GOODS}),
      new GbData({a: 'Temple-of-Relics', b: 'Relikttempel', d: ICON_GOODS})
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

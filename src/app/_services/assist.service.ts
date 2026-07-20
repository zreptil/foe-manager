import {Injectable} from '@angular/core';
import {GbData} from '@/_model/gb-data';
import {LevelData} from '@/_model/level-data';
import {HttpClient, HttpRequest} from '@angular/common/http';
import {GLOBALS} from './globals.service';

@Injectable({
  providedIn: 'root',
})
export class AssistService {
  assistVersion = '1.0';
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
        this.gbList = [];
        if (this.gbVersion === this.assistVersion) {
          const list = response.list;
          for (const src of list) {
            this.gbList.push(new GbData(src));
          }
        }
        this.loadDone = true;
        onDone?.(this.gbList);
      }
    });
  }

  importData() {
    this.importDone = false;
    this.gbList = [
      new GbData({a: 'Cosmic-Catalyst', b: 'Kosmischer Katalysator'}),
      new GbData({a: 'Stellar-Warship', b: 'Stellares Kriegsschiff'}),
      new GbData({a: 'Saturn-VI-Gate-HYDRA', b: 'Saturn VI Gate HYDRA'}),
      new GbData({a: 'Saturn-VI-Gate-PEGASUS', b: 'Saturn VI Gate PEGASUS'}),
      new GbData({a: 'Saturn-VI-Gate-CENTAURUS', b: 'Saturn VI Gate CENTAURUS'}),
      new GbData({a: 'AI-Core', b: 'K.I. Kern'}),
      new GbData({a: 'Flying-Island', b: 'Fliegende Insel'}),
      new GbData({a: 'Space-Carrier', b: 'Weltraumfrachter'}),
      new GbData({a: 'The-Virgo-Project', b: 'Virgo Projekt'}),
      new GbData({a: 'Star-Gazer', b: 'Star Gazer'}),
      new GbData({a: 'Terracotta-Army', b: 'Terrakotta Armee'}),
      new GbData({a: 'Himeji-Castle', b: 'Burg Himeji'}),
      new GbData({a: 'Atlantis-Museum', b: 'Atlantis Museum'}),
      new GbData({a: 'The-Kraken', b: 'Der Kraken'}),
      new GbData({a: 'The-Blue-Galaxy', b: 'Die blaue Galaxie'}),
      new GbData({a: 'Gaea-Statue', b: 'Gaea-Statue'}),
      new GbData({a: 'Arctic-Orangery', b: 'Arktische Orangerie'}),
      new GbData({a: 'Seed-Vault', b: 'Saatgut-Tresor'}),
      new GbData({a: 'Rain-Forest-Project', b: 'Regenwald-Projekt'}),
      new GbData({a: 'The-Arc', b: 'Die Arche'}),
      new GbData({a: 'Voyager-V1', b: 'Voyager V1'}),
      new GbData({a: 'Trust-Tower', b: 'Friedensturm'}),
      new GbData({a: 'Innovation-Tower', b: 'Innovation Tower'}),
      new GbData({a: 'Lotus-Temple', b: 'Lotustempel'}),
      new GbData({a: 'Cape-Canaveral', b: 'Cape Canaveral'}),
      new GbData({a: 'The-Habitat', b: 'Das Habitat'}),
      new GbData({a: 'Space-Needle', b: 'Space Needle'}),
      new GbData({a: 'Atomium', b: 'Atomium'}),
      new GbData({a: 'Château-Frontenac', b: 'Château Frontenac'}),
      new GbData({a: 'Alcatraz', b: 'Alcatraz'}),
      new GbData({a: 'Capitol', b: 'Capitol'}),
      new GbData({a: 'Royal-Albert-Hall', b: 'Royal Albert Hall'}),
      new GbData({a: 'Deal-Castle', b: 'Deal Castle'}),
      new GbData({a: 'Frauenkirche-of-Dresden', b: 'Dresdner Frauenkirche'}),
      new GbData({a: 'Saint-Basils-Cathedral', b: 'Basilius-Kathedrale'}),
      new GbData({a: 'Castel-del-Monte', b: 'Castel del Monte'}),
      new GbData({a: 'St.-Marks-Basilica', b: 'Markusdom'}),
      new GbData({a: 'Notre-Dame', b: 'Notre Dame'}),
      new GbData({a: 'Cathedral-of-Aachen', b: 'Aachener Dom'}),
      new GbData({a: 'Hagia-Sophia', b: 'Hagia Sophia'}),
      new GbData({a: 'Galata-Tower', b: 'Galataturm'}),
      new GbData({a: 'Colosseum', b: 'Kolosseum'}),
      new GbData({a: 'Lighthouse-of-Alexandria', b: 'Leuchtturm von Alexandria'}),
      new GbData({a: 'Tower-of-Babel', b: 'Turm zu Babel'}),
      new GbData({a: 'Statue-of-Zeus', b: 'Zeusstatue'}),
      new GbData({a: 'Observatory', b: 'Observatorium'}),
      new GbData({a: 'Oracle-of-Delphi', b: 'Orakel von Delphi'}),
      new GbData({a: 'Temple-of-Relics', b: 'Relikttempel'})
    ];
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
    ret.blocks = rewardCells.map(cell => {
      const div = cell.querySelector('div');

      return div
        ? this.parseNumber(div.textContent)
        : null;
    });
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

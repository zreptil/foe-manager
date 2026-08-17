import {Injectable} from '@angular/core';
import {HttpClient, HttpRequest} from '@angular/common/http';
import {GLOBALS} from '@/_services/globals.service';
import {QiData} from '@/_model/qi-data';
import {QiBuilding} from '@/_model/qi-building';
import {QiDef, QiSource} from '@/_model/qi-def';

@Injectable({
  providedIn: 'root',
})
export class QiService {
  qiVersion = '1.0';
  listVersion: string;
  qiList: { [key: string]: QiData };
  qiStandardList: QiDef[];
  loadDone = false;
  fullyLoaded = false;

  constructor(public http: HttpClient) {
  }

  createBuildingDef(x: number, y: number, key: string) {
    return new QiBuilding(x, y, this.qiList[key]);
  }

  loadFromAsset(onDone?: (data: any) => void) {
    const req = new HttpRequest(
      'GET',
      `assets/qi-data.json?v=${GLOBALS.version}`,
      null,
      {responseType: 'json'});
    let body: any;
    this.loadDone = false;
    this.fullyLoaded = false;
    this.http.request(req).subscribe({
      next: (data: any) => {
        body = data;
      }, error: (err) => {
        this.fullyLoaded = true;
        console.error(err);
      }, complete: () => {
        const response = body.body;
        this.listVersion = response?.version;
        // this.initData();
        this.qiList = {};
        if (this.listVersion === this.qiVersion) {
          for (const key of Object.keys(response)) {
            if (key !== 'version') {
              this.qiList[key] = new QiData({...response[key], a: key});
            }
          }
        }
        const req = new HttpRequest(
          'GET',
          `assets/qi-standard.json?v=${GLOBALS.version}`,
          null,
          {responseType: 'json'});
        this.http.request(req).subscribe({
          next: (data: any) => {
            body = data;
          }, error: (err) => {
            this.fullyLoaded = true;
            console.error(err);
          }, complete: () => {
            const response = body.body;
            this.listVersion = response?.version;
            // this.initData();
            this.qiStandardList = [];
            for (const entry of response) {
              this.qiStandardList.push(new QiDef(entry));
            }
            this.loadDone = true;
            this.fullyLoaded = true;
            onDone?.(this.qiList);
          }
        });
      }
    });
  }

  addToGroup(buildings: QiBuilding[], def: QiSource) {
    buildings.push(new QiBuilding(def.x, def.y, this.qiList[def.key]));
  }

  activateGroup(idx: number): QiBuilding[] {
    GLOBALS.user.qiGroupIdx = idx;
    const ret: QiBuilding[] = [];
    let hasTown = false;
    for (const entry of GLOBALS.user.listQi[idx].area) {
      this.addToGroup(ret, entry);
      if (entry.key === 'town-1') {
        hasTown = true;
      }
    }
    if (!hasTown) {
      GLOBALS.user.listQi[idx].area.push({x: 0, y: 0, key: 'town-1'});
      this.addToGroup(ret, {x: 0, y: 0, key: 'town-1'});
    }
    GLOBALS.saveSharedData();
    return ret;
    // this.buildings.push(new QiBuilding(9, 0, qiList['town-1']));
    // this.buildings.push(new QiBuilding(0, 0, qiList['supp-8']));
    // this.buildings.push(new QiBuilding(3, 0, qiList['supp-8']));
    // this.buildings.push(new QiBuilding(6, 0, qiList['supp-8']));
    // this.buildings.push(new QiBuilding(6, 3, qiList['supp-8']));
    // this.buildings.push(new QiBuilding(0, 3, qiList['supp-3']));
    // this.buildings.push(new QiBuilding(0, 6, qiList['supp-3']));
    // this.buildings.push(new QiBuilding(0, 9, qiList['supp-3']));
    // this.buildings.push(new QiBuilding(3, 3, qiList['cultural-4']));
    // this.buildings.push(new QiBuilding(6, 6, qiList['cultural-4']));
    // this.buildings.push(new QiBuilding(11, 6, qiList['cultural-4']));
    // this.buildings.push(new QiBuilding(11, 9, qiList['cultural-4']));
    // this.buildings.push(new QiBuilding(3, 6, qiList['supp-3']));
    // this.buildings.push(new QiBuilding(4, 10, qiList['resi-7']));
    // this.buildings.push(new QiBuilding(9, 6, qiList['resi-7']));
    // this.buildings.push(new QiBuilding(9, 8, qiList['resi-7']));
    // this.buildings.push(new QiBuilding(9, 10, qiList['resi-7']));
    // this.buildings.push(new QiBuilding(14, 6, qiList['resi-1']));
    // this.buildings.push(new QiBuilding(14, 8, qiList['resi-1']));
    // this.buildings.push(new QiBuilding(14, 10, qiList['resi-1']));
    // this.buildings.push(new QiBuilding(6, 9, qiList['mili-3']));
  }

  saveBuildings(buildings: QiBuilding[]) {
    GLOBALS.user.listQi[GLOBALS.user.qiGroupIdx].area = buildings.map(b => {
      return {x: b.x, y: b.y, key: b.qiData.key};
    });
    GLOBALS.saveSharedData();
  }
}

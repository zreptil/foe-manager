import {Component, ElementRef, ViewChild} from '@angular/core';
import {QiService} from '@/_services/qi.service';
import {QiData} from '@/_model/qi-data';
import {QiBuilding} from '@/_model/qi-building';
import {GLOBALS, GlobalsService} from '@/_services/globals.service';
import {QiDef} from '@/_model/qi-def';
import {DialogResult, DialogResultButton} from '@/_model/dialog-data';

@Component({
  selector: 'app-quanten-invasion',
  standalone: false,
  templateUrl: './quanten-invasion.component.html',
  styleUrl: './quanten-invasion.component.scss',
})
export class QuantenInvasionComponent {
  width = 16;
  height = 12;
  size = 30;
  gap = 2;
  buildings: QiBuilding[] = [];
  buildOpen = false;
  @ViewChild('zero') zero!: ElementRef;

  qiGroups: { [key: string]: string } = {
    resi: 'Wohngebäude',
    supp: 'Produktionsstätten',
    goods: 'Gütergebäude',
    cultural: 'Kulturelle Gebäude',
    deco: 'Dekorationen',
    mili: 'Militärgebäude',
  };
  movingBuilding?: QiBuilding;
  private movingSource: QiBuilding | null = null;
  private startClientX = 0;
  private startClientY = 0;
  private startX = 0;
  private startY = 0;
  private pointerId: number | null = null;

  constructor(public globals: GlobalsService,
              public qiSrv: QiService) {
    this.qiSrv.loadFromAsset((_qiList: { [key: string]: QiData }) => {
      this.buildings = this.qiSrv.activateGroup(GLOBALS.user.qiGroupIdx);
    });
  }

  get styleForMap() {
    return {
      width: `${this.width * this.size + this.gap}px`,
      height: `${this.height * this.size + this.gap}px`,
      '--gap': this.gap + 'px',
    };
  }

  get qiKeys() {
    return Object.keys(this.qiGroups);
  }

  empty(x: number, y: number) {
    return new QiBuilding(x, y, this.qiSrv?.qiList?.['empty-0']);
  }

  readonly range = (n: number) => Array.from({length: n}, (_, i) => i);

  startMoving(evt: PointerEvent, building: QiBuilding): void {
    evt.preventDefault();

    this.pointerId = evt.pointerId;

    this.startClientX = evt.clientX;
    this.startClientY = evt.clientY;

    this.startX = building.x;
    this.startY = building.y;

    this.movingSource = building;

    // Wichtig: Kopie, sonst würde das Original ebenfalls bewegt.
    this.movingBuilding = new QiBuilding(building.x, building.y, building.qiData);

    window.addEventListener('pointermove', this.moveBuilding);
    window.addEventListener('pointerup', this.stopMoving);
    window.addEventListener('pointercancel', this.stopMoving);
  }

  protected styleForBuilding(b: QiBuilding) {
    if (b == null || b === this.movingSource) {
      return {display: 'none'};
    }
    const ret: any = {
      left: `${b.x * this.size}px`,
      top: `${b.y * this.size}px`,
      width: `${b.width * this.size}px`,
      height: `${b.height * this.size}px`
    };
    if (b.x < 0 || b.y < 0 || b.x + b.width > this.width || b.y + b.height > this.height) {
      ret['--cursor'] = 'not-allowed';
    }

    return ret;
  }

  protected classForBuilding(b: QiBuilding) {
    return b?.type;
  }

  protected qiListFor(key: string) {
    const ret: QiData[] = [];
    if (this.qiSrv.fullyLoaded) {
      for (const subKey of Object.keys(this.qiSrv.qiList)) {
        if (subKey.startsWith(key)) {
          ret.push(this.qiSrv.qiList[subKey]);
        }
      }
    }
    return ret;
  }

  protected clickAdd(evt: PointerEvent, qi: QiData) {
    const cellSize = this.size + this.gap;
    const rect = this.zero?.nativeElement?.getBoundingClientRect();
    const dx = evt.clientX - rect.x - cellSize;
    const dy = evt.clientY - rect.y - cellSize;
    const x = Math.round(dx / cellSize);
    const y = Math.round(dy / cellSize);
    this.startMoving(evt, new QiBuilding(x, y, qi));
  }

  protected clickAddGroup(evt: PointerEvent) {
    evt.preventDefault();
    GLOBALS.user.listQi.push(new QiDef({
      a: 'Nächster Tag',
      b: []
    }));
    this.buildings = this.qiSrv.activateGroup(GLOBALS.user.listQi.length - 1);
  }

  protected clickAddStandardGroup(evt: PointerEvent, std: QiDef) {
    evt.preventDefault();
    GLOBALS.user.listQi.push(std);
    this.buildings = this.qiSrv.activateGroup(GLOBALS.user.listQi.length - 1);
  }

  protected clickDeleteGroup(evt: PointerEvent, idx: number) {
    evt.preventDefault();
    GLOBALS.msg.confirm(`Soll die Gruppe @${GLOBALS.user.listQi[idx].name}@ wirklich entfernt werden?`).subscribe((result: DialogResult) => {
      if (result.btn === DialogResultButton.yes) {
        GLOBALS.user.listQi.splice(idx, 1);
        if (GLOBALS.user.qiGroupIdx >= idx) {
          GLOBALS.user.qiGroupIdx--;
        }
        this.buildings = this.qiSrv.activateGroup(GLOBALS.user.qiGroupIdx);
      }
    });
  }

  protected clickGroup(evt: PointerEvent, idx: number) {
    evt.stopPropagation();
    GLOBALS.user.qiGroupIdx = idx;
    this.buildings = this.qiSrv.activateGroup(idx);
  }

  private stopMoving = (evt: PointerEvent): void => {
    if (this.movingBuilding == null ||
      this.movingSource == null ||
      this.pointerId !== evt.pointerId
    ) {
      return;
    }

    const x = this.movingBuilding.x;
    const y = this.movingBuilding.y;

    if (x >= 0 && y >= 0
      && x + this.movingBuilding.width <= this.width
      && y + this.movingBuilding.height <= this.height) {
      this.movingSource.x = x;
      this.movingSource.y = y;

      const list = [];

      for (const b of this.buildings) {
        if (b === this.movingSource) {
          list.push(b);
        } else {
          if (b.qiData.key === 'town-1' || x >= b.x + b.width || x + this.movingBuilding.width <= b.x
            || y >= b.y + b.height || y + this.movingBuilding.height <= b.y) {
            list.push(b);
          }
        }
      }
      if (list.find(b => b === this.movingSource) == null) {
        list.push(this.movingSource);
      }
      this.buildings = list;
    } else {
      if (this.movingSource.qiData.key !== 'town-1') {
        this.buildings = this.buildings.filter(b => b !== this.movingSource);
      }
    }

    this.movingBuilding = null;
    this.movingSource = null;
    this.pointerId = null;

    this.qiSrv.saveBuildings(this.buildings);

    window.removeEventListener('pointermove', this.moveBuilding);
    window.removeEventListener('pointerup', this.stopMoving);
    window.removeEventListener('pointercancel', this.stopMoving);
  }

  private moveBuilding = (evt: PointerEvent): void => {
    if (
      !this.movingBuilding ||
      this.pointerId !== evt.pointerId
    ) {
      return;
    }

    const cellSize = this.size + this.gap;

    const dx = evt.clientX - this.startClientX;
    const dy = evt.clientY - this.startClientY;

    this.movingBuilding.x =
      this.startX + Math.round(dx / cellSize);

    this.movingBuilding.y =
      this.startY + Math.round(dy / cellSize);
  }
}

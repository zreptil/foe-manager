import {BaseData} from '@/_model/base-data';
import {LevelData} from '@/_model/level-data';

export enum EnumEpoch {
  none,
  bronze_age,
  iron_age,
  early_middle_ages,
  high_middle_ages,
  late_middle_ages,
  colonial_age,
  industrial_age,
  progressive_era,
  modern_era,
  postmodern_era,
  contemporary_era,
  tomorrow_era,
  future_era,
  arctic_future,
  oceanic_future,
  virtual_future,
  space_age_mars,
  space_age_asteroid_belt,
  space_age_venus,
  space_age_jupiter_moon,
  space_age_titan,
  space_age_space_hub,
  stellar_age_discovery
}

export class GbData extends BaseData {
  key: string;
  name: string;
  icon: { key: string, class: string }[];
  levels: LevelData[];
  effects: string[];
  epoch: EnumEpoch;

  constructor(json?: any) {
    super(json);
  }

  override get _asJson(): any {
    const ret: any = {
      a: this.key,
      b: this.name,
      c: [],
      d: this.icon,
      e: this.effects,
      f: this.epoch
    };
    for (const level of this.levels) {
      ret.c.push(level.asJson);
    }
    return ret;
  }

  override _fillFromJson(json: any, def?: any): void {
    this.key = json?.a ?? def?.key;
    this.name = json?.b ?? def?.name;
    this.levels = [];
    const src = json?.c ?? def?.levels ?? [];
    for (const level of src) {
      this.levels.push(new LevelData(level));
    }
    this.icon = json?.d ?? def?.icon ?? [{key: 'apartment'}];
    this.effects = json?.e ?? def?.effects ?? [];
    this.epoch = json?.f ?? def?.epoch ?? EnumEpoch.none;
  }
}

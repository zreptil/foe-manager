import {EventPlaceData, EventTownData} from '@/_model/event-place-data';

export enum EnumEventtype {
  map
}

export class EventData {
  name: string;
  type: EnumEventtype;
  backgroundImage: string;
  iconImage: string;
  sourceUrl: string;
  places: EventPlaceData[];
  towns: EventTownData[];
}

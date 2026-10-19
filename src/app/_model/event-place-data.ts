export class EventTownData {
  progress: [number, number][];
  progressInfo: { idx: number, info: string }[];
}

export class EventPlaceData {
  name: string;
  x: number;
  y: number;
  xc: number;
  yc: number;
  levels: number[];
  costs: number[];
}

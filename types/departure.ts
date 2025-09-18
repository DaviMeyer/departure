export interface DepartureStop {
  departureTimestamp: number;
  delay?: number;
}

export interface DepartureEntry {
  category: string;
  number: string;
  to: string;
  stop: DepartureStop;
}

export interface DepartureBoard {
  stationboard: DepartureEntry[];
}
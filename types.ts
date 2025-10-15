
export interface MorseSettings {
  wpm: number;
  characterSet: string;
  groupSize: number;
  charSpaces: number; // in dot units
  wordSpaces: number; // in dot units
  volume: number; // 0 to 1
  numChars: number;
  preamble: string;
  tone: number;
}

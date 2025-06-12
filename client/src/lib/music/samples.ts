import * as Tone from 'tone';
// Helper function inline to avoid import issues
const randomFromInterval = (min: number, max: number, seed?: number) => {
  if (seed !== undefined) {
    const x = Math.sin(seed) * 10000;
    const random = x - Math.floor(x);
    return Math.floor(random * (max - min + 1)) + min;
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const SAMPLES_BASE_URL = '/samples';
export const SAMPLE_DEFAULT_VOLUME = -6;

/** A SampleGroup defines a collection of samples */
class SampleGroup {
  name: string;
  volume: number;
  size: number;
  energyRanges?: number[][];

  public constructor(name: string, size: number, volume: number, energyRanges?: number[][]) {
    this.name = name;
    this.volume = SAMPLE_DEFAULT_VOLUME + volume;
    this.energyRanges = energyRanges;
    this.size = size;
  }

  /** Gets a random sample index, based on a seed number */
  getRandomSample(seed: number) {
    return randomFromInterval(0, this.size - 1, seed);
  }

  getSampleUrl(index: number) {
    // for drumloop100 we have a single file
    if(this.name === 'drumloop100') {
      return `${SAMPLES_BASE_URL}/loops/${this.name}/${this.name}.mp3`;  
    }
    return `${SAMPLES_BASE_URL}/loops/${this.name}/${this.name}_${index + 1}.mp3`;
  }

  /** Returns sample-specific Tone.js filters */
  getFilters(): any[] {
    if (this.name.includes('drumloop')) {
      return [
        new Tone.Filter({
          type: 'lowpass',
          frequency: 2400,
          Q: 0.5
        })
      ];
    }
    return [];
  }

  /**
   * Returns an appropriate sample for a given energy level
   */
  getSampleForEnergy(energy: number, seed: number): number {
    if (!this.energyRanges) {
      return this.getRandomSample(seed);
    }

    const energyLevel = Math.floor(energy * this.energyRanges.length);
    const clampedEnergyLevel = Math.min(energyLevel, this.energyRanges.length - 1);
    const [min, max] = this.energyRanges[clampedEnergyLevel];

    return randomFromInterval(min, max, seed);
  }
}

// Sample configuration
const sampleConfig = {
  "drumloop100": { size: 1, volume: 0 },
  "drumloop105": { size: 1, volume: 0 },
  "drumloop110": { size: 1, volume: 0 },
  "drumloop120": { size: 1, volume: 0 },
  "drumloop130": { size: 1, volume: 0 },
  "drumloop140": { size: 1, volume: 0 },
  "vinyl": { size: 4, volume: -12 },
  "rain": { size: 4, volume: -18 },
  "cafe": { size: 2, volume: -15 }
};

export const SAMPLEGROUPS = new Map([
  ['drumloop100', new SampleGroup('drumloop100', sampleConfig.drumloop100.size, sampleConfig.drumloop100.volume)],
  ['drumloop105', new SampleGroup('drumloop105', sampleConfig.drumloop105.size, sampleConfig.drumloop105.volume)],
  ['drumloop110', new SampleGroup('drumloop110', sampleConfig.drumloop110.size, sampleConfig.drumloop110.volume)],
  ['drumloop120', new SampleGroup('drumloop120', sampleConfig.drumloop120.size, sampleConfig.drumloop120.volume)],
  ['drumloop130', new SampleGroup('drumloop130', sampleConfig.drumloop130.size, sampleConfig.drumloop130.volume)],
  ['drumloop140', new SampleGroup('drumloop140', sampleConfig.drumloop140.size, sampleConfig.drumloop140.volume)],
  ['vinyl', new SampleGroup('vinyl', sampleConfig.vinyl.size, sampleConfig.vinyl.volume)],
  ['rain', new SampleGroup('rain', sampleConfig.rain.size, sampleConfig.rain.volume)],
  ['cafe', new SampleGroup('cafe', sampleConfig.cafe.size, sampleConfig.cafe.volume)]
]);

/**
 * Selects appropriate drumbeat BPM based on track BPM
 */
export const selectDrumbeat = (bpm: number): string => {
  const availableBpms = [100, 105, 110, 120, 130, 140];
  const closest = availableBpms.reduce((prev, curr) => 
    Math.abs(curr - bpm) < Math.abs(prev - bpm) ? curr : prev
  );
  return `drumloop${closest}`;
};
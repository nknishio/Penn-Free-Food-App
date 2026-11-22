import type { EventLocation } from '@/types';

export interface PennLocation extends EventLocation {
  /** Lowercase names/abbreviations people use for this place (matched on word boundaries). */
  aliases: string[];
}

/** Common campus spots for free food. Coordinates are approximate building centers. */
export const PENN_LOCATIONS: PennLocation[] = [
  {
    name: 'Van Pelt Library',
    latitude: 39.9527,
    longitude: -75.1934,
    aliases: ['van pelt', 'vp library', 'vpl'],
  },
  {
    name: 'Houston Hall',
    latitude: 39.951,
    longitude: -75.1937,
    aliases: ['houston hall', 'houston'],
  },
  { name: 'Huntsman Hall', latitude: 39.953, longitude: -75.1981, aliases: ['huntsman', 'jmhh'] },
  { name: 'Towne Building', latitude: 39.952, longitude: -75.1906, aliases: ['towne'] },
  { name: 'Levine Hall', latitude: 39.9522, longitude: -75.1903, aliases: ['levine'] },
  {
    name: 'David Rittenhouse Lab',
    latitude: 39.9523,
    longitude: -75.1898,
    aliases: ['drl', 'david rittenhouse'],
  },
  {
    name: 'Singh Center',
    latitude: 39.9526,
    longitude: -75.1888,
    aliases: ['singh center', 'singh'],
  },
  { name: 'College Hall', latitude: 39.9513, longitude: -75.1941, aliases: ['college hall'] },
  { name: 'Irvine Auditorium', latitude: 39.9508, longitude: -75.1928, aliases: ['irvine'] },
  {
    name: 'Fisher Fine Arts Library',
    latitude: 39.9517,
    longitude: -75.1929,
    aliases: ['fisher fine arts', 'fine arts library'],
  },
  {
    name: 'ARCH',
    latitude: 39.9516,
    longitude: -75.1962,
    aliases: ['arch', 'arts research and culture house'],
  },
  { name: 'McNeil Building', latitude: 39.9524, longitude: -75.1968, aliases: ['mcneil'] },
  {
    name: 'Kelly Writers House',
    latitude: 39.952,
    longitude: -75.199,
    aliases: ['kelly writers house', 'writers house', 'kwh'],
  },
  {
    name: '1920 Commons',
    latitude: 39.9524,
    longitude: -75.1986,
    aliases: ['1920 commons', 'commons'],
  },
  {
    name: 'Hill College House',
    latitude: 39.9528,
    longitude: -75.1915,
    aliases: ['hill college house', 'hill house', 'hill'],
  },
  { name: 'The Quad', latitude: 39.9502, longitude: -75.2001, aliases: ['the quad', 'quad'] },
  {
    name: 'Perelman Center (PCPSE)',
    latitude: 39.9535,
    longitude: -75.1969,
    aliases: ['pcpse', 'perelman center'],
  },
  {
    name: 'Steinhardt Hall (Hillel)',
    latitude: 39.9536,
    longitude: -75.2003,
    aliases: ['hillel', 'steinhardt'],
  },
  { name: 'Penn Museum', latitude: 39.9493, longitude: -75.1913, aliases: ['penn museum'] },
];

import type { LevelId } from '../levels/themes'

export type StoryBeat = {
  title: string
  body: string[]
}

export const INTRO: StoryBeat = {
  title: 'CASCADE FORCE',
  body: [
    'The Cascade Collective seized three continents overnight.',
    'You are Unit CF-07 — last operative with a pulse and a rifle.',
    'Cut through the jungle, crack the fortress, and burn the Cascade Overlord.',
    'Weapon crates are live. Grab everything. Leave nothing standing.',
  ],
}

export const BRIEFINGS: Record<LevelId, StoryBeat> = {
  0: {
    title: 'BRIEFING — JUNGLE TEETH',
    body: [
      'Intel: Perimeter drones and canopy hunters.',
      'Mid-threat: CANOPY STALKER — armored arachnid walker.',
      'Primary: ROOTBREAKER MK-I — siege root-drill.',
      'Stay mobile. Spread fire wins green corridors.',
    ],
  },
  1: {
    title: 'BRIEFING — BASELINE SIEGE',
    body: [
      'Intel: Mag-rails and plasma turrets online.',
      'Mid-threat: RAIL CRUSHER — rolling siege chassis.',
      'Primary: FORTRESS CORE — shield-linked command node.',
      'Missiles and plasma punch armor. Inferno clears packs.',
    ],
  },
  2: {
    title: 'BRIEFING — RED CASCADE',
    body: [
      'Intel: Overlord core ascending. Expect everything.',
      'Mid-threat: VOID SENTINEL — phase-shifting guardian.',
      'Primary: CASCADE OVERLORD — final machine god.',
      'This is the hard one. Empty the arsenal.',
    ],
  },
}

export const VICTORY: StoryBeat = {
  title: 'CASCADE BROKEN',
  body: [
    'The Overlord falls. The cascade collapses.',
    'Three continents breathe again — because you never stopped firing.',
    'Unit CF-07: mission complete.',
  ],
}

export type LevelId = 0 | 1 | 2

export type LevelTheme = {
  id: LevelId
  name: string
  subtitle: string
  skyTop: string
  skyBot: string
  ground: string
  accent: string
  mist: string
  length: number
  midBossAt: number
  bossAt: number
  midBossName: string
  bossName: string
  midBossHp: number
  bossHp: number
  enemyRate: number
  difficulty: number
}

export const LEVELS: LevelTheme[] = [
  {
    id: 0,
    name: 'OPERATION: JUNGLE TEETH',
    subtitle: 'Outer perimeter — soft entry',
    skyTop: '#6a9cc8',
    skyBot: '#c5d6b8',
    ground: '#3d5a2e',
    accent: '#6b8f4e',
    mist: 'rgba(120,140,100,0.2)',
    length: 6200,
    midBossAt: 2800,
    bossAt: 5600,
    midBossName: 'CANOPY STALKER',
    bossName: 'ROOTBREAKER MK-I',
    midBossHp: 420,
    bossHp: 780,
    enemyRate: 1.15,
    difficulty: 1,
  },
  {
    id: 1,
    name: 'OPERATION: BASELINE SIEGE',
    subtitle: 'Industrial spine — hot zone',
    skyTop: '#5a6a7a',
    skyBot: '#9a8a78',
    ground: '#5a5a58',
    accent: '#8a7a60',
    mist: 'rgba(90,90,80,0.22)',
    length: 6800,
    midBossAt: 3000,
    bossAt: 6200,
    midBossName: 'RAIL CRUSHER',
    bossName: 'FORTRESS CORE',
    midBossHp: 640,
    bossHp: 1100,
    enemyRate: 0.95,
    difficulty: 1.45,
  },
  {
    id: 2,
    name: 'OPERATION: RED CASCADE',
    subtitle: 'Heart of the machine — no retreat',
    skyTop: '#3a2a28',
    skyBot: '#8a4a30',
    ground: '#4a3830',
    accent: '#a05040',
    mist: 'rgba(120,60,40,0.25)',
    length: 7400,
    midBossAt: 3200,
    bossAt: 6800,
    midBossName: 'VOID SENTINEL',
    bossName: 'CASCADE OVERLORD',
    midBossHp: 900,
    bossHp: 1800,
    enemyRate: 0.75,
    difficulty: 2.1,
  },
]

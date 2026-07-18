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
    skyTop: '#0a1f18',
    skyBot: '#143528',
    ground: '#1c3d2a',
    accent: '#3dff9a',
    mist: 'rgba(40,120,80,0.25)',
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
    skyTop: '#120c18',
    skyBot: '#2a1830',
    ground: '#2a2234',
    accent: '#ff5ad5',
    mist: 'rgba(120,40,90,0.22)',
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
    skyTop: '#1a0808',
    skyBot: '#3a1010',
    ground: '#2c1414',
    accent: '#ff3d5a',
    mist: 'rgba(180,40,40,0.28)',
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

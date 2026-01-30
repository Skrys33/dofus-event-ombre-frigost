import { useMemo, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import playersData from './data/players.json'
import { BOSSES } from './data/bosses'
import backgroundVideo from './assets/background.mp4'
import deathIcon from './assets/death.png'
import './App.css'

const totalBosses = BOSSES.length
const classIcons = import.meta.glob('./assets/classes/*.png', { eager: true, import: 'default' })
const classIconMap = Object.fromEntries(
  Object.entries(classIcons).map(([path, src]) => {
    const key = path.split('/').pop()?.replace('.png', '')
    return [key, src]
  })
)
const classKeyMap = {
  cra: 'cra',
  eca: 'eca',
  ecaflip: 'eca',
  elio: 'elio',
  eniripsa: 'eni',
  eni: 'eni',
  enutrof: 'enu',
  enu: 'enu',
  feca: 'feca',
  forge: 'forge',
  forgelance: 'forge',
  hupper: 'hupper',
  huppermage: 'hupper',
  iop: 'iop',
  osa: 'osa',
  ouginak: 'ougi',
  panda: 'panda',
  pandawa: 'panda',
  roub: 'roub',
  roublard: 'roub',
  sacri: 'sacri',
  sacrieur: 'sacri',
  sadida: 'sadi',
  sadi: 'sadi',
  sram: 'sram',
  steamer: 'steamer',
  xelor: 'xelor',
  zobal: 'zobal'
}

const normalize = (value) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const normalizeKey = (value) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const turnBosses = new Set(['klime', 'missiz', 'nileza', 'sylargh'])
const resolveTurnValue = (value) => {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}
const resolveClassIcon = (name) => {
  if (!name) return null
  const key = classKeyMap[normalizeKey(String(name))]
  return key ? classIconMap[key] ?? null : null
}

const resolveDefeatedSet = (player) => {
  if (!Array.isArray(player.defeated)) return new Set()
  const byKey = new Map(BOSSES.map((boss) => [normalizeKey(boss.slug), boss.slug]))
  BOSSES.forEach((boss) => {
    byKey.set(normalizeKey(boss.name), boss.slug)
  })
  const slugs = player.defeated
    .map((entry) => normalizeKey(String(entry)))
    .map((key) => byKey.get(key))
    .filter(Boolean)
  return new Set(slugs)
}

const resolveCleared = (defeatedSet) => {
  const baseOrder = ['rm', 'mr', 'ben', 'obsi', 'tengu', 'korri', 'kolosso', 'glour']
  const flexible = ['nileza', 'sylargh', 'klime', 'missiz']
  let cleared = 0

  for (const boss of baseOrder) {
    if (!defeatedSet.has(boss)) return cleared
    cleared += 1
  }

  for (const boss of flexible) {
    if (defeatedSet.has(boss)) cleared += 1
  }

  if (flexible.every((boss) => defeatedSet.has(boss)) && defeatedSet.has('comte')) {
    cleared += 1
  }

  return cleared
}

const resolveDeathIndex = (player) => {
  if (!player.diedAt) return -1
  const key = normalizeKey(String(player.diedAt))
  return BOSSES.findIndex((boss) => normalizeKey(boss.slug) === key || normalizeKey(boss.name) === key)
}

const resolveAverageTurns = (player, defeatedSet) => {
  const turns = player?.turns ?? null
  if (!turns) return Number.POSITIVE_INFINITY

  let total = 0
  let count = 0

  for (const slug of turnBosses) {
    if (!defeatedSet.has(slug)) continue
    const value = resolveTurnValue(turns[slug])
    if (value === null) continue
    total += value
    count += 1
  }

  return count > 0 ? total / count : Number.POSITIVE_INFINITY
}

function App() {
  return (
    <div className="app">
      <div className="video-bg" aria-hidden="true">
        <video autoPlay loop muted playsInline>
          <source src={backgroundVideo} type="video/mp4" />
        </video>
        <div className="video-overlay" />
      </div>
      <header className="hero">
        <div>
          <p className="eyebrow">Dofus - Tournoi Ombre - Run Frigost</p>
          <h1>Classement des survivants</h1>
          <p className="subtitle">
            Suivez la progression des aventuriers. <br />Chaque mort fige le parcours au boss atteint.
          </p>
        </div>
        <nav className="nav">
          <NavLink to="/" end>
            Classement
          </NavLink>
          <NavLink to="/rules">Regles</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<RankingPage />} />
          <Route path="/rules" element={<RulesPage />} />
        </Routes>
      </main>
      <footer className="footer">Developed by Skrys.</footer>
    </div>
  )
}

function RankingPage() {
  const [query, setQuery] = useState('')
  const normalizedQuery = normalize(query.trim())
  const lastUpdated = playersData.lastUpdated

  const rankedPlayers = useMemo(() => {
    const list = playersData.players
      .map((player) => {
        const defeatedSet = resolveDefeatedSet(player)
        const cleared = Math.min(resolveCleared(defeatedSet), totalBosses)
        const deathIndex = resolveDeathIndex(player)
        const averageTurns = resolveAverageTurns(player, defeatedSet)
        return { ...player, cleared, deathIndex, defeatedSet, averageTurns }
      })
      .sort((a, b) => {
        if (b.cleared !== a.cleared) return b.cleared - a.cleared
        if (a.averageTurns !== b.averageTurns) return a.averageTurns - b.averageTurns
        return a.name.localeCompare(b.name)
      })

    if (!normalizedQuery) return list
    return list.filter((player) => normalize(player.name).includes(normalizedQuery))
  }, [normalizedQuery])

  return (
    <section className="page">
      <div className="section-header">
        <div>
          <h2>Classement actuel</h2>
          {lastUpdated ? <p className="last-updated">Derniere mise à jour: {lastUpdated}</p> : null}
        </div>
        <div className="search">
          <label htmlFor="player-search">Rechercher un joueur</label>
          <input
            id="player-search"
            type="search"
            placeholder="Ex: Skrys"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="ranking-table">
        <table>
          <thead>
            <tr>
              <th className="col-rank">#</th>
              <th className="col-player">Joueur</th>
              {BOSSES.map((boss) => (
                <th key={boss.slug} className="col-boss">
                  <span className="boss-head">
                    <img src={boss.image} alt={`Boss ${boss.name}`} />
                    <span>{boss.name}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rankedPlayers.map((player, index) => (
              <PlayerRow key={player.name} player={player} rank={index + 1} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function PlayerRow({ player, rank }) {
  const status = (bossIndex) => {
    if (player.deathIndex === bossIndex) return 'death'
    if (player.defeatedSet?.has(BOSSES[bossIndex].slug)) return 'cleared'
    return 'pending'
  }

  return (
    <tr className="player-row" style={{ '--i': rank }}>
      <td className="cell-rank">#{rank}</td>
      <td className="cell-player">
        <div className="player-info">
          <div className="player-name">{player.name}</div>
          <div className="player-meta">
            {player.cleared}/{totalBosses} boss
            <br />
            {player.deathIndex === -1 ? 'Toujours en vie' : `Mort face a ${BOSSES[player.deathIndex]?.name}`}
          </div>
        </div>
        <div className="player-classes" aria-label="Classes jouees">
          {Array.from({ length: 4 }).map((_, index) => {
            const className = Array.isArray(player.classes) ? player.classes[index] : null
            const iconSrc = resolveClassIcon(className)
            return (
              <span key={`${player.name}-class-${index}`} className="player-class">
                {iconSrc ? <img src={iconSrc} alt={className ?? ''} /> : null}
              </span>
            )
          })}
        </div>
      </td>
      {BOSSES.map((boss, index) => {
        const state = status(index)
        const isTurnBoss = turnBosses.has(boss.slug)
        const turnValue = resolveTurnValue(player.turns?.[boss.slug])
        return (
          <td key={boss.slug} className={`cell-boss ${state}`}>
            {state === 'death' ? (
              <img src={deathIcon} alt="Mort" />
            ) : state === 'cleared' ? (
              isTurnBoss ? (turnValue ?? '') : '✔'
            ) : (
              ''
            )}
          </td>
        )
      })}
    </tr>
  )
}

function RulesPage() {
  return (
    <section className="page rules">
      <div className="rules-card">
        <h2>❄️ L’Épreuve du Givre Éternel ❄️</h2>
        <p>
          Aventuriers, Frigost vous observe. Ses donjons ne sont pas de simples murs de glace, mais des
          tombeaux façonnés pour ceux qui se croient invincibles. Ici, chaque pas est un pari, chaque
          combat une condamnation potentielle.
        </p>
        <p>
          L’épreuve est sans appel : avancer, toujours plus loin, sans jamais chuter. Ceux qui
          survivront graviront les marches du continent gelé, donjon après donjon, jusqu’à ce que la
          glace se referme… ou cède.
        </p>
        <p>
          Le chemin est gravé dans la glace, et nul ne pourra le contourner : Royalmouth → Mansot Royal
          → Ben le Ripate → Obsidiantre → Tengu Givrefoux → Korriandre → Kolosso → Glourséleste → Nileza
          / Klime / Sylargh / Missiz Frizz → Comte Harebourg
        </p>
        <p>
          Mais Frigost n’accorde aucune faveur. Pour entrer dans l’épreuve, chaque survivant devra se
          plier aux Lois du Givre, anciennes et inflexibles :
        </p>
        <ul>
          <li>Niveau 110, expérience verrouillée.</li>
          <li>Aucun exo autorisé, à l’exception d’un Gelano PM.</li>
          <li>
            Over vitalité et forgemagies autorisées, mais aucun brisage PA et aucune rune de
            transcendance.
          </li>
          <li>Doublons de classes interdits.</li>
          <li>Parchotages interdits.</li>
          <li>Reroll de classe interdit : le choix est définitif.</li>
          <li>Les mêmes personnages devront être conservés du début à la fin.</li>
          <li>Équipes libres : seul ou à plusieurs, chacun fait face au froid à sa manière.</li>
          <li>Les équipements peuvent être modifiés entre deux combats.</li>
          <li>Butin limité à 4.</li>
          <li>Seuls les Dofus Cawotte, Argenté et Dokoko sont autorisés.</li>
          <li>Bonbons, tatouages et toute autre altération sont formellement interdits.</li>
        </ul>
        <p>
          Au bout de cette marche funèbre attendent la gloire, la reconnaissance du serveur et
          l’honneur rare d’inscrire son nom parmi ceux qui ont défié Frigost sur Ombre.
        </p>
        <p>
          Sur ce monde, la mort est définitive. Les imprudents disparaîtront dans le blizzard. Les
          survivants, eux, deviendront une légende gravée dans la glace.
        </p>
      </div>
    </section>
  )
}

export default App

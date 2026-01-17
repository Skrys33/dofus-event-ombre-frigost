import { useMemo, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import playersData from './data/players.json'
import { BOSSES } from './data/bosses'
import backgroundVideo from './assets/background.mp4'
import './App.css'

const totalBosses = BOSSES.length

const normalize = (value) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const resolveCleared = (player) => {
  if (Number.isInteger(player.cleared)) return player.cleared
  if (Array.isArray(player.defeated)) return player.defeated.length
  if (Number.isInteger(player.progress)) return player.progress
  return 0
}

const resolveDeathIndex = (player) => {
  if (!player.diedAt) return -1
  return BOSSES.findIndex((boss) => boss.slug === player.diedAt)
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
      <footer className="footer">Statique, Vite + React, pret pour GitHub Pages.</footer>
    </div>
  )
}

function RankingPage() {
  const [query, setQuery] = useState('')
  const normalizedQuery = normalize(query.trim())

  const rankedPlayers = useMemo(() => {
    const list = playersData.players
      .map((player) => {
        const cleared = Math.min(resolveCleared(player), totalBosses)
        const deathIndex = resolveDeathIndex(player)
        return { ...player, cleared, deathIndex }
      })
      .sort((a, b) => {
        if (b.cleared !== a.cleared) return b.cleared - a.cleared
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
    if (bossIndex < player.cleared) return 'cleared'
    return 'pending'
  }

  return (
    <tr className="player-row" style={{ '--i': rank }}>
      <td className="cell-rank">#{rank}</td>
      <td className="cell-player">
        <div className="player-name">{player.name}</div>
        <div className="player-meta">
          {player.cleared}/{totalBosses} boss
          <br />
          {player.deathIndex === -1 ? 'Toujours en vie' : `Mort face a ${BOSSES[player.deathIndex]?.name}`}
        </div>
      </td>
      {BOSSES.map((boss, index) => {
        const state = status(index)
        return (
          <td key={boss.slug} className={`cell-boss ${state}`}>
            {state === 'death' ? '☠' : state === 'cleared' ? '✔' : ''}
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
        <p className="rules-note">
          Les données proviennent du fichier <code>src/data/players.json</code>. Mettez-le à jour pour
          refléter la progression.
        </p>
      </div>
    </section>
  )
}

export default App

export type Vibe = {
  slug: string
  name: string
  emoji: string
  description: string
  colors: string
  filters: {
    genre_ids?: number[]
    year_from?: number
    year_to?: number
    min_imdb_score?: number
  }
}

export const VIBES: Vibe[] = [
  {
    slug: 'acao-pipoca',
    name: 'Ação Pipoca',
    emoji: '🍿',
    description: 'Explosões, perseguições e heróis salvando o dia.',
    colors: 'from-orange-500 to-red-600',
    filters: {
      genre_ids: [28, 12], // Action, Adventure — sem filtro de nota
    },
  },
  {
    slug: 'dia-de-chuva',
    name: 'Dia de Chuva',
    emoji: '🌧️',
    description: 'Dramas emocionantes e romances para assistir enrolado no cobertor.',
    colors: 'from-blue-600 to-indigo-800',
    filters: {
      genre_ids: [18, 10749], // Drama, Romance
    },
  },
  {
    slug: 'mindfuck',
    name: 'Mindfuck',
    emoji: '👽',
    description: 'Ficção científica e mistérios que vão dar um nó na sua cabeça.',
    colors: 'from-purple-600 to-fuchsia-800',
    filters: {
      genre_ids: [878, 9648, 53], // Sci-Fi, Mystery, Thriller
    },
  },
  {
    slug: 'rir-ate-doer',
    name: 'Rir até doer',
    emoji: '😂',
    description: 'Comédias escrachadas para desligar o cérebro.',
    colors: 'from-yellow-400 to-amber-600',
    filters: {
      genre_ids: [35], // Comedy
    },
  },
  {
    slug: 'nao-olhe-para-tras',
    name: 'Não olhe para trás',
    emoji: '😱',
    description: 'Terror e suspense de gelar a espinha. Assista de luz acesa.',
    colors: 'from-stone-800 to-zinc-950',
    filters: {
      genre_ids: [27, 53], // Horror, Thriller
    },
  },
  {
    slug: 'classicos-cult',
    name: 'Clássicos Cult',
    emoji: '🎩',
    description: 'Obras atemporais do cinema mundial. De 2000 a 2010.',
    colors: 'from-emerald-600 to-teal-800',
    filters: {
      year_from: 2000,
      year_to: 2010,
    },
  },
  {
    slug: 'universo-animado',
    name: 'Universo Animado',
    emoji: '🎨',
    description: 'Animações para toda a família — Pixar, DreamWorks e além.',
    colors: 'from-sky-500 to-blue-700',
    filters: {
      genre_ids: [16], // Animation
    },
  },
  {
    slug: 'crimes-e-mentiras',
    name: 'Crimes e Mentiras',
    emoji: '🔫',
    description: 'Detetives, gangsters e jogos mortais. O crime compensa na tela.',
    colors: 'from-slate-700 to-zinc-900',
    filters: {
      genre_ids: [80, 9648], // Crime, Mystery
    },
  },
  {
    slug: 'epicos-e-fantasias',
    name: 'Épicos e Fantasias',
    emoji: '⚔️',
    description: 'Mundos impossíveis, dragões, magia e batalhas épicas.',
    colors: 'from-violet-700 to-purple-900',
    filters: {
      genre_ids: [14, 12, 36], // Fantasy, Adventure, History
    },
  },
  {
    slug: 'blockbusters-anos-2010',
    name: 'Blockbusters 2010s',
    emoji: '🎬',
    description: 'Os maiores sucessos da última década de ouro do cinema.',
    colors: 'from-rose-600 to-red-800',
    filters: {
      year_from: 2010,
      year_to: 2019,
      genre_ids: [28, 12, 878, 14], // Action, Adventure, Sci-Fi, Fantasy
    },
  },
  {
    slug: 'novidades',
    name: 'Novidades',
    emoji: '✨',
    description: 'Os filmes mais recentes chegando ao catálogo. Fresquinhos!',
    colors: 'from-cyan-500 to-indigo-600',
    filters: {
      year_from: 2023,
    },
  },
  {
    slug: 'guerras-e-conflitos',
    name: 'Guerras e Conflitos',
    emoji: '🪖',
    description: 'Da Segunda Guerra Mundial aos conflitos modernos. História em chamas.',
    colors: 'from-green-800 to-zinc-900',
    filters: {
      genre_ids: [10752, 36], // War, History
    },
  },
]

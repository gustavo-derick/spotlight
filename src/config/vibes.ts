export type Vibe = {
  slug: string
  name: string
  emoji: string
  description: string
  colors: string
  featured?: boolean
  filters: {
    genre_ids?: number[]
    tmdb_ids?: number[]
    year_from?: number
    year_to?: number
    min_imdb_score?: number
  }
}

export const VIBES: Vibe[] = [
  {
    slug: 'reviravolta',
    name: 'Não acredite em nada',
    emoji: '🔀',
    description:
      'Filmes que viram sua cabeça de cabeça pra baixo. Você não vai ver o final chegando.',
    colors: 'from-violet-900 via-rose-900 to-zinc-900',
    featured: true,
    filters: {
      // Filmes selecionados a dedo por reviravolta, choque ou quebra de expectativa
      tmdb_ids: [
        550, // Clube da Luta
        745, // O Sexto Sentido
        11324, // Ilha do Medo
        1124, // O Grande Truque
        77, // Amnésia
        27205, // A Origem
        210577, // Garota Exemplar
        629, // Os Suspeitos
        807, // Seven – Os Sete Crimes Capitais
        496243, // Parasita
        419430, // Corra!
        546554, // Entre Facas e Segredos
        458156, // Nós
        37799, // Cisne Negro
        157336, // Interestelar
        329865, // A Chegada
        141, // Donnie Darko
        453, // Uma Mente Brilhante
        37165, // O Show de Truman
        539, // Psicose
        381288, // Fragmentado
        87516, // Looper
        59967, // Código Fonte
        225240, // Predestinação
        10625, // O Efeito Borboleta
        493922, // Hereditário
        264660, // Ex Machina
        1329, // Os Outros
        10220, // Identidade
        220289, // Coerência
        340275, // Animais Noturnos
        265177, // Nightcrawler
        9479, // Prova de Inocência
        11517, // O Jogo
        146233, // Prisioneiros
        1018, // Mulholland Drive
        6947, // A Vila
        1359, // Psicopata Americano
        503919, // O Farol
        661374, // Entre Facas e Segredos 2
      ],
    },
  },
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

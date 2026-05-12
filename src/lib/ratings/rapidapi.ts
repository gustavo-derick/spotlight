// Implementação concreta do RatingsProvider usando RapidAPI.
//
// AGUARDANDO: curl completo da API do RapidAPI para implementar getRatings().
// A interface e os tipos já estão prontos — basta preencher a lógica abaixo
// após o curl ser fornecido.
//
// O método getRatings(imdbId) deve:
//   1. Chamar a RapidAPI passando o imdbId como chave de consulta
//   2. Mapear a resposta para RatingsResponse (array de RatingResult)
//   3. Lançar RatingsError tipado em caso de 404, 429, ou erro de upstream
//
// Exemplo de uso após implementação:
//   const provider = new RapidApiRatingsProvider()
//   const ratings = await provider.getRatings('tt0137523')

import type { RatingsProvider, RatingsResponse } from './client'
import { assertValidImdbId } from './client'
import type { RatingsError } from './types'

export class RapidApiRatingsProvider implements RatingsProvider {
  /**
   * Busca ratings de IMDb, Rotten Tomatoes e Letterboxd via RapidAPI.
   *
   * @param imdbId  IMDb ID no formato `tt\d{7,}`
   * @returns       Array de RatingResult com score, score_max, votes e url
   * @throws        RatingsError para erros previstos
   */
  async getRatings(imdbId: string): Promise<RatingsResponse> {
    assertValidImdbId(imdbId)

    // TODO: implementar após receber o curl do RapidAPI
    // Estrutura esperada:
    //
    // const response = await fetch('<RAPIDAPI_ENDPOINT>', {
    //   headers: {
    //     'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
    //     'X-RapidAPI-Host': '<RAPIDAPI_HOST>',
    //   },
    // })
    //
    // if (response.status === 404) throw { code: 'NOT_FOUND', ... } satisfies RatingsError
    // if (response.status === 429) throw { code: 'RATE_LIMITED', ... } satisfies RatingsError
    // if (!response.ok) throw { code: 'UPSTREAM_ERROR', ... } satisfies RatingsError
    //
    // const data = await response.json()
    // return mapRapidApiResponse(data)

    throw {
      code: 'UPSTREAM_ERROR',
      message: 'RapidApiRatingsProvider: implementação pendente (aguardando curl da API)',
      imdbId,
    } satisfies RatingsError
  }
}

/** Instância singleton do provider — use esta nos módulos consumers. */
export const ratingsProvider: RatingsProvider = new RapidApiRatingsProvider()

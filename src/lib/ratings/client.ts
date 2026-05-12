import type { RatingsError, RatingsResponse } from './types'

/**
 * Interface que todo provider de ratings deve implementar.
 *
 * O contrato principal é `getRatings(imdbId)`:
 *  - `imdbId` deve seguir o formato `tt\d{7,}` (validado pelo chamador)
 *  - Retorna `RatingsResponse` (array de ratings de uma ou mais fontes)
 *  - Lança `RatingsError` tipado em caso de falha controlada
 *
 * A implementação concreta (`RapidApiRatingsProvider`) é adicionada
 * no Bloco 6b após o curl do RapidAPI ser fornecido.
 */
export interface RatingsProvider {
  /**
   * Busca ratings agregados para um filme a partir do IMDb ID.
   *
   * @param imdbId  IMDb ID no formato `tt\d{7,}` (ex: "tt0137523")
   * @returns       Array com ratings de IMDb, Rotten Tomatoes e/ou Letterboxd
   * @throws        `RatingsError` para erros previstos (not found, rate limit, etc.)
   */
  getRatings(imdbId: string): Promise<RatingsResponse>
}

/** Regex de validação do IMDb ID — mesma regra do CHECK constraint no banco. */
export const IMDB_ID_REGEX = /^tt\d{7,}$/

/**
 * Valida o formato de um IMDb ID antes de chamar o provider.
 *
 * @param imdbId  String a validar
 * @throws        `RatingsError` com code `INVALID_IMDB_ID` se inválido
 */
export function assertValidImdbId(imdbId: string): void {
  if (!IMDB_ID_REGEX.test(imdbId)) {
    const error: RatingsError = {
      code: 'INVALID_IMDB_ID',
      message: `IMDb ID inválido: "${imdbId}". Formato esperado: tt seguido de 7+ dígitos.`,
      imdbId,
    }
    throw error
  }
}

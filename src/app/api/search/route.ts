import { NextResponse } from 'next/server'

// Rate limiting + busca implementados no Bloco 10
export async function GET() {
  return NextResponse.json({ error: 'Não implementado' }, { status: 501 })
}

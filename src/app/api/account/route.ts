import { NextResponse } from 'next/server'

// DELETE /api/account — implementado no Bloco 9
export async function DELETE() {
  return NextResponse.json({ error: 'Não implementado' }, { status: 501 })
}

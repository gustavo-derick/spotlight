interface Props {
  params: Promise<{ slug: string }>
}

export default async function FilmePage({ params }: Props) {
  const { slug } = await params
  return <main>Filme: {slug}</main>
}

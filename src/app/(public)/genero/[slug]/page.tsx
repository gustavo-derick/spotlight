interface Props {
  params: Promise<{ slug: string }>
}

export default async function GeneroPage({ params }: Props) {
  const { slug } = await params
  return <main>Gênero: {slug}</main>
}

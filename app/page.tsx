import ValentineApp from "../components/valentine-app"
import { getStaticMemories } from "../lib/static-memories"

export default async function Page() {
  const { photos, videos } = await getStaticMemories()

  return <ValentineApp photos={photos} videos={videos} />
}

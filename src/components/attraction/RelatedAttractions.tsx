import { AttractionCard } from '@/components/home/AttractionCard'
import type { Attraction } from '@/data/mockAttractions'

type RelatedAttractionsProps = {
  attractions: Attraction[]
}

export function RelatedAttractions({ attractions }: RelatedAttractionsProps) {
  return (
    <section>
      <h2 className="mb-5 text-xl font-bold text-foreground sm:text-2xl">
        You might also like
      </h2>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {attractions.map((attraction) => (
          <AttractionCard key={attraction.id} attraction={attraction} />
        ))}
      </div>
    </section>
  )
}

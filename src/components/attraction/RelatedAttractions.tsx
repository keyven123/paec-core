import { AttractionCard } from '@/components/home/AttractionCard'
import type { Attraction } from '@/data/mockAttractions'

type RelatedAttractionsProps = {
  attractions: Attraction[]
}

export function RelatedAttractions({ attractions }: RelatedAttractionsProps) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-foreground sm:mb-5 sm:text-2xl">
        You might also like
      </h2>
      <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4">
        {attractions.map((attraction) => (
          <AttractionCard
            key={attraction.id}
            attraction={attraction}
            className="w-[44%] min-w-[10.5rem] shrink-0 snap-start sm:w-auto sm:min-w-0"
          />
        ))}
      </div>
    </section>
  )
}

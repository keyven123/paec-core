import { CategoryBar } from '@/components/home/CategoryBar'

type CategorySectionProps = {
  activeCategory: string
  onCategoryChange: (id: string) => void
}

export function CategorySection({
  activeCategory,
  onCategoryChange,
}: CategorySectionProps) {
  return (
    <section className="border-b border-violet-100 bg-white px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <CategoryBar
          active={activeCategory}
          onChange={onCategoryChange}
          variant="section"
        />
      </div>
    </section>
  )
}

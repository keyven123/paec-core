import type { ActivityCategoryOption } from '@/lib/activityCategories'
import { CategoryBar } from '@/components/home/CategoryBar'

type CategorySectionProps = {
  categories: Array<ActivityCategoryOption>
  activeCategory: string
  onCategoryChange: (id: string) => void
  loading?: boolean
}

export function CategorySection({
  categories,
  activeCategory,
  onCategoryChange,
  loading = false,
}: CategorySectionProps) {
  return (
    <section className="border-b border-violet-100 bg-white px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <CategoryBar
          categories={categories}
          active={activeCategory}
          onChange={onCategoryChange}
          loading={loading}
          variant="section"
        />
      </div>
    </section>
  )
}

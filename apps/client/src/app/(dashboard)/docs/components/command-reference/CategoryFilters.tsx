import { CATEGORY_COLORS } from '../../constants/docsData';

import { FilterChip } from './FilterChip';

interface CategoryFiltersProps {
    categories: string[];
    activeCategory: string | null;
    onCategoryChange: (category: string | null) => void;
    isMobile?: boolean;
}

export function CategoryFilters({
    categories,
    activeCategory,
    onCategoryChange,
    isMobile = false,
}: CategoryFiltersProps) {
    return (
        <div
            className={
                isMobile
                    ? 'flex gap-2 overflow-x-auto docs-scrollbar mt-4 pb-2 -mx-1 px-1'
                    : 'flex gap-2 flex-wrap mt-5 mb-4'
            }
        >
            <FilterChip
                label="ALL"
                active={activeCategory === null}
                color="var(--accent)"
                onClick={() => onCategoryChange(null)}
            />

            {categories.map((category) => (
                <FilterChip
                    key={category}
                    label={category.toUpperCase()}
                    active={activeCategory === category}
                    color={CATEGORY_COLORS[category] ?? 'var(--accent)'}
                    onClick={() => onCategoryChange(category)}
                />
            ))}
        </div>
    );
}

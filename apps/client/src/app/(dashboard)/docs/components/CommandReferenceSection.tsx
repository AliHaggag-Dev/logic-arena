import { CategoryFilters } from './command-reference/CategoryFilters';
import { DesktopCommandTable } from './command-reference/DesktopCommandTable';
import { MobileCommandList } from './command-reference/MobileCommandList';
import { useCommandReference } from './command-reference/useCommandReference';
import { SectionLabel } from './SectionLabel';

export function CommandReferenceSection({ isMobile }: { isMobile: boolean }) {
  const {
    activeCategory,
    categories,
    commands,
    expandedCommandKey,
    handleCategoryChange,
    handleCommandToggle,
    totalCommands,
  } = useCommandReference();

  if (isMobile) {
    return (
      <section className="mb-10">
        <SectionLabel text="COMMAND REFERENCE" isMobile={true} />
        <CategoryFilters
          activeCategory={activeCategory}
          categories={categories}
          isMobile
          onCategoryChange={handleCategoryChange}
        />
        <MobileCommandList
          commands={commands}
          expandedCommandKey={expandedCommandKey}
          onCommandToggle={handleCommandToggle}
          totalCommands={totalCommands}
        />
      </section>
    );
  }

  return (
    <section className="mb-[60px]">
      <SectionLabel text="COMMAND REFERENCE" />
      <CategoryFilters
        activeCategory={activeCategory}
        categories={categories}
        onCategoryChange={handleCategoryChange}
      />
      <DesktopCommandTable commands={commands} totalCommands={totalCommands} />
    </section>
  );
}

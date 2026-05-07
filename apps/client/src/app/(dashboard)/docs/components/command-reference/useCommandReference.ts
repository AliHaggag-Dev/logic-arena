import { useMemo, useState } from 'react';

import { COMMAND_TABLE } from '../../constants/docsData';

export function useCommandReference() {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [expandedCommandKey, setExpandedCommandKey] = useState<string | null>(null);

    const categories = useMemo(
        () => Array.from(new Set(COMMAND_TABLE.map((command) => command.category))),
        [],
    );

    const commands = useMemo(
        () =>
            activeCategory
                ? COMMAND_TABLE.filter((command) => command.category === activeCategory)
                : COMMAND_TABLE,
        [activeCategory],
    );

    const handleCategoryChange = (category: string | null) => {
        setActiveCategory((currentCategory) =>
            category === currentCategory ? null : category,
        );
        setExpandedCommandKey(null);
    };

    const handleCommandToggle = (commandKey: string) => {
        setExpandedCommandKey((currentKey) =>
            currentKey === commandKey ? null : commandKey,
        );
    };

    return {
        activeCategory,
        categories,
        commands,
        expandedCommandKey,
        handleCategoryChange,
        handleCommandToggle,
        totalCommands: COMMAND_TABLE.length,
    };
}

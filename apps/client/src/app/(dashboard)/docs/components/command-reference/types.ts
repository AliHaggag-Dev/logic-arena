import type { CommandDoc } from '../../constants/docsData';

export interface CommandReferenceViewProps {
    commands: CommandDoc[];
    totalCommands: number;
    activeCategory: string | null;
    expandedCommandKey: string | null;
    categories: string[];
    onCategoryChange: (category: string | null) => void;
    onCommandToggle: (commandKey: string) => void;
}

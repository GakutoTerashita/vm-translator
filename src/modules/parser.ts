type Parser = {
    lines: string[];
    instruction: string;
};

export const advance = (parser: Parser): Parser => {
    // ...
};

export const hasMoreLines = (lines: string[]): boolean => (
    lines.length > 0
);

export const breakLine = (line: string): string[] => (
    line.split('\n').filter(part => part.trim() !== '')
);

export const removeComments = (lines: string[]): string[] => (
    lines
        .map(line => line.startsWith('//') ? '' : line.trim())
        .filter(line => line !== '')
);
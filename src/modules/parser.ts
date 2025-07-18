type Parser = {
    lines: string[];
    command: string;
};

export const advance = (parser: Parser): Parser => {
    if (!hasMoreLines(parser.lines)) {
        throw new Error('No more lines to parse');
    }

    return {
        lines: parser.lines.slice(1),
        command: parser.lines[0] || ''
    }
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
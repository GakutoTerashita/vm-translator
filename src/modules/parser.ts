type Parser = {
    lines: string[];
    command: string;
};

type CommandType =
    | 'C_ARITHMETIC'
    | 'C_PUSH'
    | 'C_POP'
    | 'C_LABEL'
    | 'C_GOTO'
    | 'C_IF'
    | 'C_FUNCTION'
    | 'C_RETURN'
    | 'C_CALL';

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

export const commandType = (command: string): CommandType => {
    const parts = command.split(' ');
    const cmd = parts[0];

    // TODO
    switch (cmd) {
        case 'add':
        case 'sub':
        case 'neg':
        case 'eq':
        case 'gt':
        case 'lt':
        case 'and':
        case 'or':
        case 'not':
            return 'C_ARITHMETIC';
        default:
            throw new Error(`Unknown command type: ${cmd}`);
    }
};
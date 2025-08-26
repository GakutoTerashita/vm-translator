export type Parser = {
    lines: string[];
    command: string;
};

export const createParser = (lines: string[]): Parser => ({
    lines,
    command: ''
});

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
        .map(line => (line.split('//')[0] || '').trim())
        .filter(line => line !== '')
);

export type CommandType =
    | 'C_ARITHMETIC'
    | 'C_PUSH'
    | 'C_POP'
    | 'C_LABEL'
    | 'C_GOTO'
    | 'C_IF'
    | 'C_FUNCTION'
    | 'C_RETURN'
    | 'C_CALL';

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
        case 'push':
            return 'C_PUSH';
        case 'pop':
            return 'C_POP';
        case 'label':
            return 'C_LABEL';
        case 'goto':
            return 'C_GOTO';
        case 'if-goto':
            return 'C_IF';
        case 'function':
            return 'C_FUNCTION';
        case 'return':
            return 'C_RETURN';
        case 'call':
            return 'C_CALL';
        default:
            throw new Error(`Unknown command type: ${cmd}`);
    }
};

export const arg1 = (command: string): string => {
    const parts = command.split(' ');

    if (commandType(command) === 'C_ARITHMETIC') {

        const val = parts[0];

        if (!val) {
            throw new Error(`Command does not have an argument: ${command}`);
        }

        return val;
    } else if (parts.length > 1) {

        const val = parts[1];

        if (!val) {
            throw new Error(`Command does not have an argument: ${command}`);
        }

        return val;
    }

    throw new Error(`Command does not have an argument: ${command}`);
};

export const arg2 = (command: string): string => {
    const parts = command.split(' ');

    if (
        commandType(command) === 'C_PUSH' ||
        commandType(command) === 'C_POP' ||
        commandType(command) === 'C_FUNCTION' ||
        commandType(command) === 'C_CALL'
    ) {

        if (parts.length < 3) {
            throw new Error(`Command does not have a second argument: ${command}`);
        }

        const val = parts[2];

        if (!val) {
            throw new Error(`Command does not have a second argument: ${command}`);
        }

        return val;
    }

    throw new Error(`Command does not have a second argument: ${command}`);
};
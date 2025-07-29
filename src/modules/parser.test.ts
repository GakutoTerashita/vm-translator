import { advance, breakLine, commandType, hasMoreLines, removeComments } from "./parser";

describe('Parser', () => {

    describe('advance', () => {
        it('update command and lines when there are more lines', () => {
            const parser = {
                lines: ['line1', 'line2'],
                command: ''
            };
            const result = advance(parser);
            expect(result).toEqual({
                lines: ['line2'],
                command: 'line1'
            });
        });

        it('throw an error when there are no more lines', () => {
            const parser = {
                lines: [],
                command: ''
            };
            expect(() => advance(parser)).toThrow('No more lines to parse');
        });
    });

    describe('hasMoreLines', () => {
        it('return true if there are more lines', () => {
            const lines = ['line1', 'line2'];
            expect(hasMoreLines(lines)).toBe(true);
        });

        it('return false if there are no lines', () => {
            const lines: string[] = [];
            expect(hasMoreLines(lines)).toBe(false);
        });
    });

    describe('breakLine', () => {
        it('split a string by new lines and filter out empty parts', () => {
            const input = 'line1\nline2\n\nline3';
            const result = breakLine(input);
            expect(result).toEqual(['line1', 'line2', 'line3']);
        });

        it('return an empty array for an empty string', () => {
            const result = breakLine('');
            expect(result).toEqual([]);
        });
    });

    describe('removeComments', () => {
        it('remove lines starting with // and trim whitespace', () => {
            const input = ['line1', '// comment', '  line2  ', '', 'line3'];
            const result = removeComments(input);
            expect(result).toEqual(['line1', 'line2', 'line3']);
        });

        it('return an empty array if all lines are comments or empty', () => {
            const input = ['// comment1', '// comment2'];
            const result = removeComments(input);
            expect(result).toEqual([]);
        });
    });

    describe('commandType', () => {
        it('return the correct command type for C_ARITHMETIC', () => {
            const testCommands: [string, string][] = [
                ['add', 'C_ARITHMETIC'],
                ['sub', 'C_ARITHMETIC'],
                ['neg', 'C_ARITHMETIC'],
                ['eq', 'C_ARITHMETIC'],
                ['gt', 'C_ARITHMETIC'],
                ['lt', 'C_ARITHMETIC'],
                ['and', 'C_ARITHMETIC'],
                ['or', 'C_ARITHMETIC'],
                ['not', 'C_ARITHMETIC']
            ];

            testCommands.forEach(([command, expectedType]) => {
                const result = commandType(command);
                expect(result).toBe(expectedType);
            });
        });

        it('return the correct command type for C_PUSH', () => {
            const command = 'push constant 10';
            const result = commandType(command);
            expect(result).toBe('C_PUSH');
        });

        it('return the correct command type for C_POP', () => {
            const command = 'pop local 0';
            const result = commandType(command);
            expect(result).toBe('C_POP');
        });

        it('return the correct command type for C_LABEL', () => {
            const command = 'label myLabel';
            const result = commandType(command);
            expect(result).toBe('C_LABEL');
        });

        it('return the correct command type for C_GOTO', () => {
            const command = 'goto myLabel';
            const result = commandType(command);
            expect(result).toBe('C_GOTO');
        });

        it('return the correct command type for C_IF', () => {
            const command = 'if-goto myLabel';
            const result = commandType(command);
            expect(result).toBe('C_IF');
        });

        it('return the correct command type for C_FUNCTION', () => {
            const command = 'function MyFunction 2';
            const result = commandType(command);
            expect(result).toBe('C_FUNCTION');
        });

        it('return the correct command type for C_RETURN', () => {
            const command = 'return';
            const result = commandType(command);
            expect(result).toBe('C_RETURN');
        });

        it('return the correct command type for C_CALL', () => {
            const command = 'call MyFunction 2';
            const result = commandType(command);
            expect(result).toBe('C_CALL');
        });
    });
});
import { advance, arg1, arg2, breakLine, commandType, hasMoreLines, removeComments } from "./parser";

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

    describe('arg1', () => {
        it('return the first argument for C_ARITHMETIC commands', () => {
            const command = 'add';
            const result = arg1(command);
            expect(result).toBe('add');
        });

        it('return the second part of the command for non-arithmetic commands', () => {
            const command = 'push constant 10';
            const result = arg1(command);
            expect(result).toBe('constant');
        });

        it('throw an error if the command does not have an argument', () => {
            const command = 'return';
            expect(() => arg1(command)).toThrow('Command does not have an argument: return');
        });
    });

    describe('arg2', () => {
        it('return the second argument for C_PUSH commands', () => {
            const command = 'push constant 10';
            const result = arg2(command);
            expect(result).toBe('10');
        });

        it('return the second argument for C_POP commands', () => {
            const command = 'pop local 0';
            const result = arg2(command);
            expect(result).toBe('0');
        });

        it('return the second argument for C_FUNCTION commands', () => {
            const command = 'function MyFunction 2';
            const result = arg2(command);
            expect(result).toBe('2');
        });

        it('return the second argument for C_CALL commands', () => {
            const command = 'call MyFunction 2';
            const result = arg2(command);
            expect(result).toBe('2');
        });

        it('throw an error if the command does not have a second argument', () => {
            const command = 'push constant';
            expect(() => arg2(command)).toThrow('Command does not have a second argument: push constant');
        });
    });
});
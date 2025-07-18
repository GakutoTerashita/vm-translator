import { advance, breakLine, hasMoreLines, removeComments } from "./parser";

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
});
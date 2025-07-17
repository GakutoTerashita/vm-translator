import { breakLine, removeComments } from "./parser";

describe('Parser', () => {

    describe('breakLine', () => {
        it('should split a string by new lines and filter out empty parts', () => {
            const input = 'line1\nline2\n\nline3';
            const result = breakLine(input);
            expect(result).toEqual(['line1', 'line2', 'line3']);
        });

        it('should return an empty array for an empty string', () => {
            const result = breakLine('');
            expect(result).toEqual([]);
        });
    });

    describe('removeComments', () => {
        it('should remove lines starting with // and trim whitespace', () => {
            const input = ['line1', '// comment', '  line2  ', '', 'line3'];
            const result = removeComments(input);
            expect(result).toEqual(['line1', 'line2', 'line3']);
        });

        it('should return an empty array if all lines are comments or empty', () => {
            const input = ['// comment1', '// comment2'];
            const result = removeComments(input);
            expect(result).toEqual([]);
        });
    });
});
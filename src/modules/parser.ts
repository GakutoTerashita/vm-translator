export const breakLine = (line: string): string[] => (
    line.split('\n').filter(part => part.trim() !== '')
)

export const removeComments = (lines: string[]): string[] => (
    lines
        .map(line => line.startsWith('//') ? '' : line.trim())
        .filter(line => line !== '')
)
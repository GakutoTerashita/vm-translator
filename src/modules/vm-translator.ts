import { readFile } from "fs/promises";
import { advance, arg1, arg2, breakLine, commandType, createParser, hasMoreLines, Parser, removeComments } from "./parser";
import { createStream, genArithmetic, genPop, genPush, write } from "./codeWriter";
import { WriteStream } from "fs";

const loadFileName = async (): Promise<[Parser, WriteStream, string]> => {
    const fileName: string | undefined = process.argv[2];

    if (!fileName) {
        console.error('No file provided.');
        process.exit(1);
    }

    if (!fileName.endsWith('.vm')) {
        console.error('File must have a .vm extension.');
        process.exit(1);
    }

    const vmRaw = await readFile(fileName, 'utf-8');
    const vmLines = removeComments(breakLine(vmRaw));
    const parser = createParser(vmLines);
    const stream = createStream(fileName.replace('.vm', '.asm'));
    const fileNameWithoutExtensionAndPath = fileName.split('/').pop()?.replace('.vm', '') || '';

    return [parser, stream, fileNameWithoutExtensionAndPath];
};

const processCommand = (
    command: string,
    labelNameGenCount: number,
    vmFileNameWithoutExtensionAndPath?: string
): {
    asm: string[],
    labelNameGenCount: number
} => {
    const type = commandType(command);
    switch (type) {
        case 'C_ARITHMETIC':
            return genArithmetic(command, labelNameGenCount);
        case 'C_PUSH':
            return {
                asm: genPush(
                    arg1(command),
                    parseInt(arg2(command)),
                    vmFileNameWithoutExtensionAndPath,
                ),
                labelNameGenCount
            };
        case 'C_POP':
            return {
                asm: genPop(
                    arg1(command),
                    parseInt(arg2(command)),
                    vmFileNameWithoutExtensionAndPath,
                ),
                labelNameGenCount
            };
        case 'C_LABEL':
        case 'C_GOTO':
        case 'C_IF':
        case 'C_FUNCTION':
        case 'C_RETURN':
        case 'C_CALL':
        default:
            throw new Error(`Unknown command type: ${type}`);
    }
}

const processVmCodes = (parser: Parser, stream: WriteStream, fileNameWithoutExtensionAndPath: string) => {
    let currentParser = parser;
    let labelNameGenCount = 0;

    while (hasMoreLines(currentParser.lines)) {
        currentParser = advance(currentParser);

        const {
            asm,
            labelNameGenCount: labelNameGenCountNew
        } = processCommand(
            currentParser.command,
            labelNameGenCount,
            fileNameWithoutExtensionAndPath
        );

        labelNameGenCount = labelNameGenCountNew;
        write(stream, asm);
    }
};

export const translateVmToAsm = async () => {
    const [parser, stream, fileNameWithoutExtensionAndPath] = await loadFileName();

    try {
        processVmCodes(parser, stream, fileNameWithoutExtensionAndPath);
    } catch (error) {
        console.error('Error during translation:', error);
        stream.end();
        process.exit(1);
    }

    stream.end();
    console.log('Translation completed successfully.');
};
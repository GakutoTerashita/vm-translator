import { readdir, readFile } from "fs/promises";
import { advance, arg1, arg2, breakLine, commandType, createParser, hasMoreLines, Parser, removeComments } from "./parser";
import { createStream, genArithmetic, genCall, genFunction, genGoto, genIf, genLabel, genPop, genPush, genReturn, write } from "./codeWriter";
import { WriteStream } from "fs";
import path from "path";

const loadFileName = async (): Promise<{ stream: WriteStream, parsers: Array<[Parser, string]> }> => {
    const arg: string | undefined = process.argv[2];

    if (!arg) {
        console.error('No file provided.');
        process.exit(1);
    }

    if (!arg.endsWith('.vm')) {
        console.log('Assuming input is directory')

        const fileNames = await readdir(arg);
        const vmFiles = fileNames.filter(file => file.endsWith('.vm'));

        if (vmFiles.length === 0) {
            console.error('No .vm files found in directory.');
            process.exit(1);
        }

        const stream = createStream(`${arg}.asm`);

        return {
            stream, parsers: await Promise.all(vmFiles.map(async (vmFile) => {
                const vmRaw = await readFile(path.join(arg, vmFile), 'utf-8');
                const vmLines = removeComments(breakLine(vmRaw));
                const parser = createParser(vmLines);
                const fileNameWithoutExtensionAndPath = vmFile.replace('.vm', '');
                return [parser, fileNameWithoutExtensionAndPath];
            }))
        };
    } else {
        const stream = createStream(arg.replace('.vm', '.asm'));

        const vmRaw = await readFile(arg, 'utf-8');
        const vmLines = removeComments(breakLine(vmRaw));
        const parser = createParser(vmLines);
        const fileNameWithoutExtensionAndPath = arg.split('/').pop()?.replace('.vm', '') || '';

        return {
            stream, parsers: [[parser, fileNameWithoutExtensionAndPath]]
        };
    }

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
            return {
                asm: genLabel(
                    arg1(command)
                ),
                labelNameGenCount
            };
        case 'C_GOTO':
            return {
                asm: genGoto(
                    arg1(command)
                ),
                labelNameGenCount
            };
        case 'C_IF':
            return {
                asm: genIf(
                    arg1(command)
                ),
                labelNameGenCount
            };
        case 'C_FUNCTION':
            if (!vmFileNameWithoutExtensionAndPath) {
                throw new Error('file name is required for C_FUNCTION');
            }
            return {
                asm: genFunction(
                    arg1(command),
                    parseInt(arg2(command))
                ),
                labelNameGenCount,
            };
        case 'C_RETURN':
            return {
                asm: genReturn(),
                labelNameGenCount
            };
        case 'C_CALL':
            return genCall(
                labelNameGenCount,
                arg1(command),
                parseInt(arg2(command)),
            );
        default:
            throw new Error(`Unknown command type: ${type}`);
    }
}

const processVmCodes = (parser: Parser, fileNameWithoutExtensionAndPath: string): Array<string> => {
    let currentParser = parser;
    let labelNameGenCount = 0;

    const asm: Array<string> = [];

    while (hasMoreLines(currentParser.lines)) {
        currentParser = advance(currentParser);

        const {
            asm: out,
            labelNameGenCount: labelNameGenCountNew
        } = processCommand(
            currentParser.command,
            labelNameGenCount,
            fileNameWithoutExtensionAndPath
        );

        labelNameGenCount = labelNameGenCountNew;
        asm.push(...out.flat());
    }

    return asm;
};

export const translateVmToAsm = async () => {
    const { stream, parsers } = await loadFileName();

    if (parsers.length > 1) {
        const asm: Array<string> = [
            "// bootstrap code",
            "@256",
            "D=A",
            "@SP",
            "M=D",
            ...genCall(0, "Sys.init", 0).asm.flat(),
        ];

        write(stream, asm);
    }

    parsers.forEach(([parser, name]) => {
        try {
            const asm = processVmCodes(parser, name);
            write(stream, asm);
        } catch (error) {
            console.error('Error during translation:', error);
            stream.end();
            process.exit(1);
        }
    })

    stream.end();
    console.log('Translation completed successfully.');
};
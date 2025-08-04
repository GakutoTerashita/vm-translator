import { createWriteStream, WriteStream } from "fs";

export const createStream = (fileName: string): WriteStream => {
    const stream = createWriteStream(fileName, 'utf8');
    return stream;
};

export const writePushPop = (
    stream: WriteStream,
    command: string,
    segment: string,
    index: number
): void => {
    if (command !== 'push' && command !== 'pop') {
        throw new Error("Command must be 'push' or 'pop'.");
    }

    if (command === 'push') {
        const code = genPush(command, segment, index);
        write(stream, code);
    }

    if (command === 'pop') {
        const code = genPop(command, segment, index);
        write(stream, code);
    }
};

const resolveSegCode = (segment: string): string => {
    const segCodeMap: Record<string, string> = {
        'argument': 'ARG',
        'local': 'LCL',
        'this': 'THIS',
        'that': 'THAT',
        'pointer': 'R3',
        'temp': 'R5',
        'constant': 'CONSTANT',
        'static': 'STATIC'
    };

    const segmentCode = segCodeMap[segment];

    if (!segmentCode) {
        throw new Error(`Invalid segment: ${segment}`);
    }
    return segmentCode;
};

export const genPush = (command: string, segment: string, index: number): string[] => {
    const output: string[] = [];

    const segmentCode = resolveSegCode(segment);
    if (segmentCode === 'STATIC') {
        throw new Error("Static segment handling is not implemented yet.");
    }

    output.push(`// push ${segment} ${index}`);
    if (segmentCode === 'CONSTANT') {
        output.push(`@${index}`);
        output.push('D=A');
    } else {
        output.push(`@${segmentCode}`);
        output.push('D=M');
        output.push(`@${index}`);
        output.push('A=D+A');
        output.push('D=M');
    }
    output.push('@SP');
    output.push('A=M');
    output.push('M=D');
    output.push('@SP');
    output.push('M=M+1');

    return output;
};

export const genPop = (command: string, segment: string, index: number): string[] => {
    const output: string[] = [];

    const segmentCode = resolveSegCode(segment);

    if (segmentCode === 'STATIC') {
        throw new Error("Static segment handling is not implemented yet.");
    }

    output.push(`// pop ${segment} ${index}`);
    output.push(`@${segmentCode}`);
    output.push('D=M');
    output.push(`@${index}`);
    output.push('A=D+A');
    output.push('D=M');
    output.push('@SP');
    output.push('A=M');
    output.push('M=D');
    output.push('@SP');
    output.push('M=M-1');

    return output;
};

export const genArithmetic = (command: string): string[] => {
    const output: string[] = [];
    output.push(`// ${command}`);
    output.push('@SP');
    output.push('AM=M-1');
    output.push('D=M');
    output.push('@SP');
    output.push('AM=M-1');
    output.push('M=D+M');
    output.push('@SP');
    output.push('M=M+1');
    return output;
};

export const write = (stream: WriteStream, data: string[]): void => {
    data.forEach(line => {
        stream.write(`${line}\n`);
    });
};
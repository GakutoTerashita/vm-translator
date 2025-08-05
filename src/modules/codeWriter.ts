import { createWriteStream, WriteStream } from "fs";

export const createStream = (fileName: string): WriteStream => {
    const stream = createWriteStream(fileName, 'utf8');
    return stream;
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

    if (segmentCode === 'CONSTANT') {
        throw new Error("Pop operation on constant segment is not valid.");
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
    if (command === 'add') {
        return genAdd();
    }
    if (command === 'sub') {
        return genSub();
    }
    if (command === 'neg') {
        return genNeg();
    }
    if (command === 'eq') {
        return genEq();
    }

    throw new Error(`Unknown arithmetic command: ${command}`);
};

const genAdd = (): string[] => {
    const output: string[] = [];
    output.push('// add');
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

const genSub = (): string[] => {
    const output: string[] = [];
    output.push('// sub');
    output.push('@SP');
    output.push('AM=M-1');
    output.push('D=M');
    output.push('@SP');
    output.push('AM=M-1');
    output.push('M=M-D');
    output.push('@SP');
    output.push('M=M+1');
    return output;
};

const genNeg = (): string[] => {
    const output: string[] = [];
    output.push('// neg');
    output.push('@SP');
    output.push('AM=M-1');
    output.push('M=-M');
    output.push('@SP');
    output.push('M=M+1');
    return output;
};

const genEq = (): string[] => {
    const output: string[] = [];
    output.push('// eq');
    output.push('@SP');
    output.push('AM=M-1');
    output.push('D=M');
    output.push('@SP');
    output.push('AM=M-1');
    output.push('D=M-D');
    output.push('@EQ_TRUE');
    output.push('D;JEQ');
    output.push('@SP');
    output.push('A=M');
    output.push('M=0'); // false
    output.push('@END_EQ');
    output.push('0;JMP');
    output.push('(EQ_TRUE)');
    output.push('@SP');
    output.push('A=M');
    output.push('M=-1'); // true
    output.push('(END_EQ)');
    output.push('@SP');
    output.push('M=M+1');
    return output;
};

export const write = (stream: WriteStream, data: string[]): void => {
    data.forEach(line => {
        stream.write(`${line}\n`);
    });
};
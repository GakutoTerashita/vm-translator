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

export const genArithmetic = (command: string, labelNameGenCount: number): {
    asm: string[],
    labelNameGenCount: number
} => {
    switch (command) {
        case 'add':
            return { asm: genAdd(), labelNameGenCount };
        case 'sub':
            return { asm: genSub(), labelNameGenCount };
        case 'neg':
            return { asm: genNeg(), labelNameGenCount };
        case 'eq':
            return genComparisonOp(labelNameGenCount, 'eq');
        case 'gt':
            return genComparisonOp(labelNameGenCount, 'gt');
        case 'lt':
            return genComparisonOp(labelNameGenCount, 'lt');
        default:
            throw new Error(`Unknown arithmetic command: ${command}`);
    }
};

const genAdd = (): string[] => {
    const asm: string[] = [];
    asm.push('// add');
    asm.push('@SP');
    asm.push('AM=M-1');
    asm.push('D=M');
    asm.push('@SP');
    asm.push('AM=M-1');
    asm.push('M=D+M');
    asm.push('@SP');
    asm.push('M=M+1');
    return asm;
};

const genSub = (): string[] => {
    const asm: string[] = [];
    asm.push('// sub');
    asm.push('@SP');
    asm.push('AM=M-1');
    asm.push('D=M');
    asm.push('@SP');
    asm.push('AM=M-1');
    asm.push('M=M-D');
    asm.push('@SP');
    asm.push('M=M+1');
    return asm;
};

const genNeg = (): string[] => {
    const asm: string[] = [];
    asm.push('// neg');
    asm.push('@SP');
    asm.push('AM=M-1');
    asm.push('M=-M');
    asm.push('@SP');
    asm.push('M=M+1');
    return asm;
};

const genComparisonOp = (
    labelNameGenCount: number,
    op: 'eq' | 'gt' | 'lt',
): {
    asm: string[],
    labelNameGenCount: number
} => {
    const output: string[] = [];
    const labelNames = [
        `${op.toUpperCase()}_TRUE_${labelNameGenCount}`,
        `END_${op.toUpperCase()}_${labelNameGenCount}`,
    ];
    output.push(`// ${op}`);
    output.push('@SP');
    output.push('AM=M-1');
    output.push('D=M');
    output.push('@SP');
    output.push('AM=M-1');
    output.push('D=M-D');
    output.push(`@${labelNames[0]}`);
    output.push(`D;J${op.toUpperCase()}`);
    output.push('@SP');
    output.push('A=M');
    output.push('M=0'); // false
    output.push(`@${labelNames[1]}`);
    output.push('0;JMP');
    output.push(`(${labelNames[0]})`);
    output.push('@SP');
    output.push('A=M');
    output.push('M=-1'); // true
    output.push(`(${labelNames[1]})`);
    output.push('@SP');
    output.push('M=M+1');
    return {
        asm: output,
        labelNameGenCount: (labelNameGenCount + 1)
    };
};

export const write = (stream: WriteStream, data: string[]): void => {
    data.forEach(line => {
        stream.write(`${line}\n`);
    });
};
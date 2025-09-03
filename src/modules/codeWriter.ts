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
        'pointer': 'PTR',
        'temp': 'TEMP',
        'constant': 'CONSTANT',
        'static': 'STATIC'
    };

    const segmentCode = segCodeMap[segment];

    if (!segmentCode) {
        throw new Error(`Invalid segment: ${segment}`);
    }
    return segmentCode;
};

export const genPush = (
    segment: string,
    index: number,
    vmFileNameWithoutExtensionAndPath?: string,
): Array<string> => {
    const output: Array<string> = [];
    const segmentCode = resolveSegCode(segment);

    output.push(`// push ${segment} ${index}`);

    switch (segmentCode) {
        case 'CONSTANT':
            output.push(`@${index}`);
            output.push('D=A');
            break;
        case 'PTR':
            output.push(`@${index + 3}`); // pointer segments start at 3
            output.push('D=M');
            break;
        case 'TEMP':
            output.push(`@${index + 5}`); // temp segments start at 5
            output.push('D=M');
            break;
        case 'STATIC':
            output.push(`@${vmFileNameWithoutExtensionAndPath}.${index}`);
            output.push('D=M');
            break;
        default:
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

export const genPop = (
    segment: string,
    index: number,
    vmFileNameWithoutExtensionAndPath?: string,
): Array<string> => {
    const output: Array<string> = [];
    const segmentCode = resolveSegCode(segment);

    if (segmentCode === 'CONSTANT') {
        throw new Error("Pop operation on constant segment is not valid.");
    }

    output.push(`// pop ${segment} ${index}`);

    if (
        segmentCode !== 'PTR' &&
        segmentCode !== 'TEMP' &&
        segmentCode !== 'STATIC'
    ) {
        output.push(`@${segmentCode}`);
        output.push('D=M');
        output.push(`@${index}`);
        output.push('D=D+A');
        output.push('@R13'); // R13 is allowed to be used as a temporal storage.
        output.push('M=D');
    }

    // actual "popping"
    output.push('@SP');
    output.push('AM=M-1');
    output.push('D=M');

    switch (segmentCode) {
        case 'PTR':
            output.push(`@${index + 3}`); // pointer segments start at 3
            output.push('M=D');
            break;
        case 'TEMP':
            output.push(`@${index + 5}`); // temp segments start at 5
            output.push('M=D');
            break;
        case 'STATIC':
            output.push(`@${vmFileNameWithoutExtensionAndPath}.${index}`);
            output.push('M=D');
            break;
        default:
            output.push('@R13');
            output.push('A=M');
            output.push('M=D');
    }

    return output;
};

export const genArithmetic = (command: string, labelNameGenCount: number): {
    asm: Array<string>,
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
        case 'and':
            return { asm: genAnd(), labelNameGenCount };
        case 'or':
            return { asm: genOr(), labelNameGenCount };
        case 'not':
            return { asm: genNot(), labelNameGenCount };
        default:
            throw new Error(`Unknown arithmetic command: ${command}`);
    }
};

const genAdd = (): Array<string> => {
    const asm: Array<string> = [];
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

const genSub = (): Array<string> => {
    const asm: Array<string> = [];
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

const genNeg = (): Array<string> => {
    const asm: Array<string> = [];
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
    asm: Array<string>,
    labelNameGenCount: number
} => {
    const output: Array<string> = [];
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

const genAnd = (): Array<string> => {
    const asm: Array<string> = [];
    asm.push('// and');
    asm.push('@SP');
    asm.push('AM=M-1');
    asm.push('D=M');
    asm.push('@SP');
    asm.push('AM=M-1');
    asm.push('M=D&M');
    asm.push('@SP');
    asm.push('M=M+1');
    return asm;
};

const genOr = (): Array<string> => {
    const asm: Array<string> = [];
    asm.push('// or');
    asm.push('@SP');
    asm.push('AM=M-1');
    asm.push('D=M');
    asm.push('@SP');
    asm.push('AM=M-1');
    asm.push('M=D|M');
    asm.push('@SP');
    asm.push('M=M+1');
    return asm;
};

const genNot = (): Array<string> => {
    const asm: Array<string> = [];
    asm.push('// not');
    asm.push('@SP');
    asm.push('AM=M-1');
    asm.push('M=!M');
    asm.push('@SP');
    asm.push('M=M+1');
    return asm;
};

export const genLabel = (labelName: string): Array<string> => {
    const asm: Array<string> = [];
    const label = labelName.toUpperCase();
    asm.push(`// label ${label}`);
    asm.push(`(${label})`);
    return asm;
};

export const genGoto = (labelName: string): Array<string> => {
    const asm: Array<string> = [];
    const label = labelName.toUpperCase();
    asm.push(`// goto ${label}`);
    asm.push(`@${label}`);
    asm.push('0;JMP');
    return asm;
};

export const genIf = (labelName: string): Array<string> => {
    const asm: Array<string> = [];
    const label = labelName.toUpperCase();
    asm.push(`// if-goto ${label}`);
    asm.push('@SP');
    asm.push('AM=M-1');
    asm.push('D=M');
    asm.push(`@${label}`);
    asm.push('D;JNE');
    return asm;
};

export const genFunction = (functionName: string, nVars: number): Array<string> => {
    const asm: Array<string> = [];
    asm.push(`// function ${functionName} ${nVars}`);
    asm.push(`(${functionName})`);
    asm.push(...Array.from({ length: nVars }, () => genPush('constant', 0)).flat());
    return asm;
};

export const genReturn = (): Array<string> => {
    const asm: Array<string> = [];
    asm.push('// return');
    asm.push('@LCL');
    asm.push('D=M');
    asm.push('@R13');
    asm.push('M=D');
    asm.push('@5')
    asm.push('D=D-A');
    asm.push('@R14');
    asm.push('M=D');
    asm.push(...genPop('argument', 0).flat());
    asm.push('@ARG');
    asm.push('D=M');
    asm.push('@SP');
    asm.push('M=D+1');

    asm.push("@R13");
    asm.push("D=M");
    asm.push("@1")
    asm.push("A=D-A");
    asm.push("D=M");
    asm.push("@THAT");
    asm.push("M=D");

    asm.push("@R13");
    asm.push("D=M");
    asm.push("@2")
    asm.push("A=D-A");
    asm.push("D=M");
    asm.push("@THIS");
    asm.push("M=D");
    asm.push("@R13");
    asm.push("D=M");

    asm.push("@3")
    asm.push("A=D-A");
    asm.push("D=M");
    asm.push("@ARG");
    asm.push("M=D");
    asm.push("@R13");
    asm.push("D=M");
    asm.push("@4");
    asm.push("A=D-A");
    asm.push("D=M");
    asm.push("@LCL");
    asm.push("M=D");

    asm.push("@R14");
    asm.push("A=M");
    asm.push("0;JMP");
    return asm;
};

export const genCall = (
    labelNameGenCount: number,
    functionName: string,
    nArgs: number
): {
    asm: Array<string>,
    labelNameGenCount: number,
} => ({
    asm: [
        `// call ${functionName} ${nArgs}`,
        `@${functionName}.retaddr.${labelNameGenCount}`,
        "D=A",
        "@SP",
        "A=M",
        "M=D",
        "@SP",
        "M=M+1",

        "@LCL",
        "D=M",
        "@SP",
        "A=M",
        "M=D",
        "@SP",
        "M=M+1",

        "@ARG",
        "D=M",
        "@SP",
        "A=M",
        "M=D",
        "@SP",
        "M=M+1",

        "@THIS",
        "D=M",
        "@SP",
        "A=M",
        "M=D",
        "@SP",
        "M=M+1",

        "@THAT",
        "D=M",
        "@SP",
        "A=M",
        "M=D",
        "@SP",
        "M=M+1",

        "@SP",
        "D=M",
        `@${nArgs + 5}`,
        'D=D-A',
        "@ARG",
        "M=D",
        "@SP",
        "D=M",
        "@LCL",
        "M=D",

        `@${functionName}`,
        "0;JMP",

        `(${functionName}.retaddr.${labelNameGenCount})`,
    ],
    labelNameGenCount: labelNameGenCount + 1
})

export const write = (stream: WriteStream, data: Array<string>): void => {
    data.forEach(line => {
        stream.write(`${line}\n`);
    });
};
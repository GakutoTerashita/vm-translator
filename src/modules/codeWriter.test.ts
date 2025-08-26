import { readFileSync, unlink } from "fs";
import {
    createStream,
    write,
    genPush,
    genPop,
    genArithmetic,
    genLabel,
    genGoto
} from "./codeWriter";
import { randomUUID } from "crypto";

const streamEndAsync = (stream: NodeJS.WritableStream): Promise<void> => {
    return new Promise(resolve => {
        stream.on('finish', () => {
            resolve();
        });
        stream.end();
    });
};

const genTestOutFileName = (): string => (
    `testFile-${randomUUID().toString().replace(/-/g, '')}.txt`
);

describe('CodeWriter', () => {

    describe('createStream', () => {

        it('create a write stream with the provided file name', () => {
            const fileName = genTestOutFileName();
            const stream = createStream(fileName);
            expect(stream.path).toBe(fileName);

            // Clean up the created file after the test
            stream.end(() => {
                unlink(fileName, (err) => {
                    if (err) {
                        console.error(`Error deleting file: ${fileName}`, err);
                    }
                });
            });
        });

    });

    describe('genPush', () => {

        it('generates a correct assembly code for a given push operation', async () => {
            const data = genPush('local', 2);

            expect(data).toEqual([
                "// push local 2",
                "@LCL",
                "D=M",
                "@2",
                "A=D+A",
                "D=M",
                "@SP",
                "A=M",
                "M=D",
                "@SP",
                "M=M+1"
            ]);
        });

        it('assembly code for constant segment', () => {
            const data = genPush('constant', 5);

            expect(data).toEqual([
                "// push constant 5",
                "@5",
                "D=A",
                "@SP",
                "A=M",
                "M=D",
                "@SP",
                "M=M+1"
            ]);
        });

        it('assembly code for pointer segment 0', () => {
            const asm = genPush('pointer', 0);

            expect(asm).toEqual([
                "// push pointer 0",
                "@3",
                "D=M",
                "@SP",
                "A=M",
                "M=D",
                "@SP",
                "M=M+1"
            ]);
        });

        it('assembly code for pointer segment 1', () => {
            const asm = genPush('pointer', 1);

            expect(asm).toEqual([
                "// push pointer 1",
                "@4",
                "D=M",
                "@SP",
                "A=M",
                "M=D",
                "@SP",
                "M=M+1"
            ]);
        });

        it('assembly code for temp segment', () => {
            const asm = genPush('temp', 2);

            expect(asm).toEqual([
                "// push temp 2",
                "@7",
                "D=M",
                "@SP",
                "A=M",
                "M=D",
                "@SP",
                "M=M+1",
            ]);
        });

        it('assembly code for static segment', () => {
            const asm = genPush(
                'static',
                3,
                'hoge',
            );

            expect(asm).toEqual([
                "// push static 3",
                "@hoge.3",
                "D=M",
                "@SP",
                "A=M",
                "M=D",
                "@SP",
                "M=M+1"
            ]);
        });
    });

    describe('genPop', () => {

        it('generates a correct assembly code for a given pop operation', async () => {
            const data = genPop('argument', 3);

            expect(data).toEqual([
                "// pop argument 3",
                "@ARG",
                "D=M",
                "@3",
                "D=D+A",
                "@R13", // R13 is allowed to be used as a temporal storage.
                "M=D",
                "@SP",
                "AM=M-1",
                "D=M",
                "@R13",
                "A=M",
                "M=D",
            ]);
        });

        it('constant for pop is meaningless', () => {
            expect(() => genPop('constant', 5))
                .toThrow("Pop operation on constant segment is not valid.");
        });

        it('assembly code for pointer segment 0', () => {
            const asm = genPop('pointer', 0);

            expect(asm).toEqual([
                "// pop pointer 0",
                "@SP",
                "AM=M-1",
                "D=M",
                "@3",
                "M=D",
            ]);
        });

        it('assembly code for pointer segment 1', () => {
            const asm = genPop('pointer', 1);

            expect(asm).toEqual([
                "// pop pointer 1",
                "@SP",
                "AM=M-1",
                "D=M",
                "@4",
                "M=D",
            ]);
        });

        it('assembly code for temp segment', () => {
            const asm = genPop('temp', 4);

            expect(asm).toEqual([
                "// pop temp 4",
                "@SP",
                "AM=M-1",
                "D=M",
                "@9",
                "M=D",
            ]);
        });

        it('assembly code for static segment', () => {
            const asm = genPop(
                'static',
                5,
                'hoge',
            );

            expect(asm).toEqual([
                "// pop static 5",
                "@SP",
                "AM=M-1",
                "D=M",
                "@hoge.5",
                "M=D",
            ]);
        });

    });

    describe('genArithmetic', () => {
        describe('Add', () => {
            it('generates assembly code', () => {
                const data = genArithmetic('add', 0);

                expect(data.asm).toEqual([
                    "// add",
                    "@SP",
                    "AM=M-1",
                    "D=M",
                    "@SP",
                    "AM=M-1",
                    "M=D+M",
                    "@SP",
                    "M=M+1"
                ]);
            });
        });

        describe('Sub', () => {
            it('generates assembly code', () => {
                const data = genArithmetic('sub', 0);

                expect(data.asm).toEqual([
                    "// sub",
                    "@SP",
                    "AM=M-1",
                    "D=M",
                    "@SP",
                    "AM=M-1",
                    "M=M-D",
                    "@SP",
                    "M=M+1"
                ]);
            });
        });

        describe('Neg', () => {
            it('generates assembly code', () => {
                const data = genArithmetic('neg', 0);

                expect(data.asm).toEqual([
                    "// neg",
                    "@SP",
                    "AM=M-1",
                    "M=-M",
                    "@SP",
                    "M=M+1"
                ]);
            });
        });

        describe('Eq', () => {
            it('generates assembly code', () => {
                const data = genArithmetic('eq', 0);

                expect(data.asm).toEqual([
                    "// eq",
                    "@SP",
                    "AM=M-1",
                    "D=M",
                    "@SP",
                    "AM=M-1",
                    "D=M-D",
                    "@EQ_TRUE_0",
                    "D;JEQ",
                    "@SP",
                    "A=M",
                    "M=0", // false
                    "@END_EQ_0",
                    "0;JMP",
                    "(EQ_TRUE_0)",
                    "@SP",
                    "A=M",
                    "M=-1", // true
                    "(END_EQ_0)",
                    "@SP",
                    "M=M+1"
                ]);
            });

            it('increments labelNameGenCount for each eq command', () => {
                const data1 = genArithmetic('eq', 0);
                const data2 = genArithmetic('eq', data1.labelNameGenCount);
                expect(data2.labelNameGenCount).toBe(data1.labelNameGenCount + 1);
            });

        });

        describe('Gt', () => {
            it('generates assembly code', () => {
                const data = genArithmetic('gt', 0);

                expect(data.asm).toEqual([
                    "// gt",
                    "@SP",
                    "AM=M-1",
                    "D=M",
                    "@SP",
                    "AM=M-1",
                    "D=M-D",
                    "@GT_TRUE_0",
                    "D;JGT",
                    "@SP",
                    "A=M",
                    "M=0", // false
                    "@END_GT_0",
                    "0;JMP",
                    "(GT_TRUE_0)",
                    "@SP",
                    "A=M",
                    "M=-1", // true
                    "(END_GT_0)",
                    "@SP",
                    "M=M+1"
                ]);
            });

            it('increments labelNameGenCount for each gt command', () => {
                const data1 = genArithmetic('gt', 0);
                const data2 = genArithmetic('gt', data1.labelNameGenCount);
                expect(data2.labelNameGenCount).toBe(data1.labelNameGenCount + 1);
            });

        });

        describe('Lt', () => {
            it('generates assembly code', () => {
                const data = genArithmetic('lt', 0);

                expect(data.asm).toEqual([
                    "// lt",
                    "@SP",
                    "AM=M-1",
                    "D=M",
                    "@SP",
                    "AM=M-1",
                    "D=M-D",
                    "@LT_TRUE_0",
                    "D;JLT",
                    "@SP",
                    "A=M",
                    "M=0", // false
                    "@END_LT_0",
                    "0;JMP",
                    "(LT_TRUE_0)",
                    "@SP",
                    "A=M",
                    "M=-1", // true
                    "(END_LT_0)",
                    "@SP",
                    "M=M+1"
                ]);
            });

            it('increments labelNameGenCount for each lt command', () => {
                const data1 = genArithmetic('lt', 0);
                const data2 = genArithmetic('lt', data1.labelNameGenCount);
                expect(data2.labelNameGenCount).toBe(data1.labelNameGenCount + 1);
            });

        });

        describe('and', () => {
            it('generates assembly code', () => {
                const data = genArithmetic('and', 0);

                expect(data.asm).toEqual([
                    "// and",
                    "@SP",
                    "AM=M-1",
                    "D=M",
                    "@SP",
                    "AM=M-1",
                    "M=D&M",
                    "@SP",
                    "M=M+1"
                ]);
            });
        });

        describe('or', () => {
            it('generates assembly code', () => {
                const data = genArithmetic('or', 0);

                expect(data.asm).toEqual([
                    "// or",
                    "@SP",
                    "AM=M-1",
                    "D=M",
                    "@SP",
                    "AM=M-1",
                    "M=D|M",
                    "@SP",
                    "M=M+1"
                ]);
            });
        });

        describe('not', () => {
            it('generates assembly code', () => {
                const data = genArithmetic('not', 0);

                expect(data.asm).toEqual([
                    "// not",
                    "@SP",
                    "AM=M-1",
                    "M=!M",
                    "@SP",
                    "M=M+1"
                ]);
            });
        });

    });

    describe('genLabel', () => {
        it('generates asm of a label definition', () => {
            const asm = genLabel('MY_LABEL');
            expect(asm).toEqual([
                '// label MY_LABEL',
                '(MY_LABEL)'
            ]);
        });
    });

    describe('genGoto', () => {
        it('generates asm of jump', () => {
            const asm = genGoto('MY_LABEL');
            expect(asm).toEqual([
                "// goto MY_LABEL",
                "@MY_LABEL",
                "0;JMP",
            ]);
        });
    });

    describe('write', () => {

        it('writes provided array of strings to the stream', async () => {
            const fileName = genTestOutFileName();
            const stream = createStream(fileName);
            const data = [
                "// push local 2",
                "@LCL",
                "D=M",
                "@2",
                "A=D+A",
                "D=M",
                "@SP",
                "A=M",
                "M=D",
                "@SP",
                "M=M+1"
            ];
            write(stream, data);
            await streamEndAsync(stream);

            const writtenData = readFileSync(fileName, 'utf-8')
                .split('\n')
                .filter(line => line.trim() !== '');
            expect(writtenData).toEqual(data);

            // Clean up the created file after the test
            unlink(fileName, (err) => {
                if (err) {
                    console.error(`Error deleting file: ${fileName}`, err);
                }
            });
        });

    });

});
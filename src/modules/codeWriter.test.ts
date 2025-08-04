import { readFileSync, unlink } from "fs";
import {
    createStream,
    write,
    genPush,
    genPop,
    genArithmetic
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
            const data = genPush('push', 'local', 2);

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
            const data = genPush('push', 'constant', 5);

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

    });

    describe('genPop', () => {

        it('generates a correct assembly code for a given pop operation', async () => {
            const data = genPop('pop', 'argument', 3);

            expect(data).toEqual([
                "// pop argument 3",
                "@ARG",
                "D=M",
                "@3",
                "A=D+A",
                "D=M",
                "@SP",
                "A=M",
                "M=D",
                "@SP",
                "M=M-1"
            ]);
        });

    });

    describe('genArithmetic', () => {
        describe('Add', () => {
            it('generates assembly code', () => {
                const data = genArithmetic('add');

                expect(data).toEqual([
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
import { readFileSync, unlink } from "fs";
import { createStream, write, genPush, genPop } from "./codeWriter";
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
});
import { unlink } from "fs";
import { createStream, writePushPop } from "./codeWriter";
import { randomUUID } from "crypto";
import { readFile } from "fs/promises";

describe('CodeWriter', () => {

    describe('createStream', () => {
        it('create a write stream with the provided file name', () => {
            const fileName = `testFile-${randomUUID().toString().replace(/-/g, '')}.txt`;
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

    describe('writePushPop', () => {
        it('writes the correct assembly code to the stream, for a given push operation', async () => {
            // mock file
            const fileName = `testFile-${randomUUID().toString().replace(/-/g, '')}.txt`;
            const stream = createStream(fileName);

            writePushPop(stream, 'push', 'local', 2);

            await new Promise<void>(resolve => {
                stream.on('finish', () => {
                    resolve();
                });
                stream.end();
            });

            // check if the file was created and contains the expected content
            const data = await readFile(stream.path, 'utf8');
            // Here you would check the content of the file
            expect(data).toBe(`// push local 2
@LCL
D=M
@2
A=D+A
D=M
@SP
A=M
M=D
@SP
M=M+1
`);

            // Clean up the created file after the test
            stream.end(() => {
                unlink(fileName, (err) => {
                    if (err) {
                        console.error(`Error deleting file: ${fileName}`, err);
                    }
                });
            });
        });

        it('writes the correct assembly code to the stream, for a given pop operation', () => {
            // TODO
        });
    });
});
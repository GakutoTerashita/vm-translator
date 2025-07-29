import { readFile, unlink } from "fs";
import { createStream, writePushPop } from "./codeWriter";
import { randomUUID } from "crypto";

describe('CodeWriter', () => {

    describe('createStream', () => {

        it('create a write stream with the provided file name', () => {
            // mock file
            const mockFileName = `testFile-${randomUUID().toString().replace(/-/g, '')}.txt`;
            vi.spyOn(process, 'argv', 'get').mockReturnValue(['node', 'script.js', mockFileName]);
            const stream = createStream();
            expect(stream.path).toBe(mockFileName);

            // remove created file
            stream.end();
            stream.on('close', () => {
                unlink(mockFileName, (err) => {
                    if (err) throw err;
                });
            });
        });
    });

    describe('writePushPop', () => {
        it('writes the correct assembly code to the stream, for a given push/pop operation', () => {
            // mock file
            const mockFileName = `testFile-${randomUUID().toString().replace(/-/g, '')}.txt`;
            vi.spyOn(process, 'argv', 'get').mockReturnValue(['node', 'script.js', mockFileName]);
            const stream = createStream();

            writePushPop(stream, 'push', 'local', 2);

            stream.end();

            // check if the file was created and contains the expected content
            stream.on('close', () => {
                readFile(mockFileName, 'utf8', (err, data) => {
                    if (err) throw err;

                    // Here you would check the content of the file

                    // clean up the file after test
                    unlink(mockFileName, (err) => {
                        if (err) throw err;
                    });
                });
            });
        });
    });
});
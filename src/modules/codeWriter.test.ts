import { unlink } from "fs";
import { createStream } from "./codeWriter";

describe('CodeWriter', () => {

    describe('createStream', () => {
        it('should create a write stream with the provided file name', () => {
            const mockFileName = 'testFileaabaaababaabababa.txt';
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
});
import { createWriteStream, WriteStream } from "fs";

export const createStream = (): WriteStream => {
    const fileName = process.argv[2];

    if (!fileName) {
        throw new Error("File name must be provided as a command line argument.");
    }

    const stream = createWriteStream(fileName, 'utf8');
    return stream;
};

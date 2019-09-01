import Blob from './blob';


const $$filename = Symbol('filename');
const $$modified = Symbol('modified');

export default class FileImpl extends Blob implements File {
    /** @internal */ private [$$filename]: string;
    /** @internal */ private [$$modified]: number | undefined;

    public constructor(fileBits: BlobPart[], fileName: string, { lastModified, ...options }: FilePropertyBag = {}) {
        super(fileBits, options);
        this[$$filename] = fileName;
        this[$$modified] = lastModified;
    }

    public get name(): string {
        return this[$$filename];
    }

    public get lastModified(): number {
        return this[$$modified] || Date.now();
    }
}
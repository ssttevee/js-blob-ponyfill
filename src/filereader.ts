import BlobImpl, { $$size, $$buffers } from './blob';
import { bufferToBinaryString, bufferToDataURL, bufferToText } from './transform';

const $$state = Symbol('state');
const $$result = Symbol('result');
const $$error = Symbol('error');
const $$handlers = Symbol('handlers');
const $$abort = Symbol('abort');

type ProgressEventHandler = (this: FileReader, evt: ProgressEvent) => any;

interface HandlersDict {
    abort: ProgressEventHandler;
    error: ProgressEventHandler;
    load: ProgressEventHandler;
    loadend: ProgressEventHandler;
    loadstart: ProgressEventHandler;
    progress: ProgressEventHandler;
}

function tick(): Promise<true> {
    return new Promise((resolve) => setTimeout(resolve, 0, true));
}

async function read(this: FileReaderImpl, blob: BlobImpl, transform?: (buf: Uint8Array) => string): Promise<void> {
    if (this[$$state] === FileReaderImpl.LOADING) {
        throw new DOMException('InvalidStateError');
    }

    const abort = new Promise<false>((resolve) => this[$$abort] = () => resolve(false));

    const bytes = new Uint8Array(blob[$$size]);

    this[$$state] = FileReaderImpl.LOADING;
    this[$$result] = null;
    this[$$error] = null;

    this.dispatchEvent(new ProgressEvent('loadstart', {
        lengthComputable: true,
        loaded: 0,
        total: bytes.length,
    }));

    let offset = 0;
    for (const buf of blob[$$buffers]) {
        // simulate asynchronous behaviour
        if (!await Promise.race([tick(), abort])) {
            return;
        }

        bytes.set(buf, offset);
        offset += buf.length;

        // NOTE: Progress event is not dispatched because, according to the w3 spec,
        //       it should be sent approximately every 50ms. Since there is no actual
        //       latency, it's unlikey this step will take more 50ms to complete.
        //
        //       See https://w3c.github.io/FileAPI/#readOperation for more information.
    }

    this[$$state] = FileReaderImpl.DONE;
    this[$$result] = transform ? transform(bytes) : bytes.buffer;

    this.dispatchEvent(new ProgressEvent('load', {
        lengthComputable: true,
        loaded: bytes.length,
        total: bytes.length,
    }));

    if (this[$$state] === FileReaderImpl.LOADING) {
        return;
    }

    this.dispatchEvent(new ProgressEvent('loadend', {
        lengthComputable: true,
        loaded: blob[$$size],
        total: blob[$$size],
    }));
}

type State = typeof FileReaderImpl.EMPTY | typeof FileReaderImpl.LOADING | typeof FileReaderImpl.DONE;

export default class FileReaderImpl extends EventTarget implements FileReader {
    public static readonly EMPTY = 0;
    public static readonly LOADING = 1;
    public static readonly DONE = 2;

    public readonly EMPTY = FileReaderImpl.EMPTY;
    public readonly LOADING = FileReaderImpl.LOADING;
    public readonly DONE = FileReaderImpl.DONE;

    /** @internal */ private [$$state]: State = FileReaderImpl.EMPTY;
    /** @internal */ private [$$result]: string | ArrayBuffer | null = null;
    /** @internal */ private [$$error]: DOMException | null = null;
    /** @internal */ private [$$handlers]: Partial<HandlersDict> = {};
    /** @internal */ private [$$abort]: (() => void) | null = null;

    public get error(): DOMException | null {
        return this[$$error];
    }

    public get readyState(): State {
        return this[$$state];
    }

    public get result(): string | ArrayBuffer | null {
        return this[$$result];
    }

    public abort(): void {
        if (this[$$state] !== FileReaderImpl.LOADING) {
            return;
        }

        this[$$state] = FileReaderImpl.DONE;
        this[$$result] = null;

        this[$$abort]!();

        this.dispatchEvent(new ProgressEvent('abort'));

        if (this[$$state] === FileReaderImpl.LOADING) {
            return;
        }

        this.dispatchEvent(new ProgressEvent('loadend'));
    }

    public readAsArrayBuffer(blob: BlobImpl): void {
        read.call(this, blob);
    }

    public readAsBinaryString(blob: BlobImpl): void {
        read.call(this, blob, bufferToBinaryString);
    }

    public readAsDataURL(blob: BlobImpl): void {
        read.call(this, blob, bufferToDataURL.bind(undefined, blob.type));
    }

    public readAsText(blob: BlobImpl, encoding?: string): void {
        read.call(this, blob, bufferToText.bind(undefined, encoding));
    }
}

export default interface FileReaderImpl {
    onabort: ProgressEventHandler | null;
    onerror: ProgressEventHandler | null;
    onload: ProgressEventHandler | null;
    onloadend: ProgressEventHandler | null;
    onloadstart: ProgressEventHandler | null;
    onprogress: ProgressEventHandler | null;
}

for (const event of ['abort', 'error', 'load', 'loadend', 'loadstart', 'progress'] as Array<keyof HandlersDict>) {
    Object.defineProperty(FileReaderImpl.prototype, 'on' + event, {
        get(this: FileReaderImpl): ProgressEventHandler | null {
            return this[$$handlers][event] || null;
        },
        set(this: FileReaderImpl, callback: ProgressEventHandler | null) {
            if (this[$$handlers][event]) {
                this.removeEventListener(event, this[$$handlers][event]! as EventListener);
            }
    
            this.addEventListener(event, this[$$handlers][event] = callback as EventListener);
        },
    });
}

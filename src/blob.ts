import { mergeArrays } from '@ssttevee/u8-utils';


/** @internal */ export const $$buffers = Symbol('buffers');
/** @internal */ export const $$merged = Symbol('merged');
/** @internal */ export const $$size = Symbol('size');

const $$options = Symbol('options');

let encoder: TextEncoder | undefined;

export default class BlobImpl implements Blob {
    /** @internal */ private [$$options]: BlobPropertyBag;
    /** @internal */ private [$$buffers]: Uint8Array[] = [];
    /** @internal */ private [$$size]: number;

    constructor(blobParts: BlobPart[] = [], options: BlobPropertyBag = {}) {
        const { endings } = this[$$options] = options;
        if (endings !== undefined && endings !== 'transparent') {
            throw new TypeError('only transparent endings are supported');
        }

        for (let blobPart of blobParts) {
            if (typeof blobPart === 'string') {
                if (!encoder) {
                    encoder = new TextEncoder();
                }

                this[$$buffers].push(encoder.encode(blobPart));
                continue;
            }

            if (blobPart instanceof Uint8Array) {
                this[$$buffers].push(blobPart);
                continue;
            }

            if (ArrayBuffer.isView(blobPart)) {
                blobPart = blobPart.buffer;
            }

            if (blobPart instanceof ArrayBuffer) {
                this[$$buffers].push(new Uint8Array(blobPart));
                continue;
            }

            if (blobPart instanceof BlobImpl) {
                this[$$buffers].push(...blobPart[$$buffers]);
            }
        }

        this[$$size] = this[$$buffers].reduce((size, buf) => size + buf.length, 0);
    }

    public get size(): number {
        return this[$$size];
    }

    public get type(): string {
        return this[$$options].type || '';
    }

    /** @internal */ public get [$$merged](): Uint8Array {
        return mergeArrays(...this[$$buffers]);
    }

    public slice(start: number = 0, end: number = this[$$size], contentType: string = ''): Blob {
        if (start < 0) {
            start = Math.max(this[$$size] + end, 0);
        } else {
            start = Math.min(start, this[$$size]);
        }

        if (end < 0) {
            end = Math.max(this[$$size] + end, 0);
        } else {
            end = Math.min(end, this[$$size]);
        }

        if (Array.from(contentType, (_: any, i: number) => contentType.charCodeAt(i)).some((c: number) => c < 0x20 || 0x7e < c)) {
            contentType = '';
        } else {
            contentType = String.prototype.toLowerCase.call(contentType);
        }

        const newParts = [];

        let offset = 0;
        for (const buf of this[$$buffers]) {
            const sum = offset + buf.length;
            if (sum < start) {
                continue;
            }

            if (!newParts.length) {
                if (sum < end) {
                    newParts.push(buf.slice(start - offset, end - offset));
                    break;
                }

                newParts.push(buf.slice(start - offset));
            }

            if (sum < end) {
                newParts.push(buf.slice(0, end - offset));
                break;
            }

            newParts.push(buf);
        }

        return new BlobImpl(newParts, { type: contentType });
    }

    public stream(): ReadableStream<Uint8Array> {
        return new ReadableStream({
            type: 'bytes',
            start: (controller: ReadableStreamDefaultController) => {
                for (const buf of this[$$buffers]) {
                    controller.enqueue(buf);
                }

                controller.close();
            },
        });
    }

    public text(): Promise<string> {
        return Promise.resolve(new TextDecoder().decode(this[$$merged]));
    }

    public arrayBuffer(): Promise<ArrayBuffer> {
        return Promise.resolve(this[$$merged].buffer);
    }
}

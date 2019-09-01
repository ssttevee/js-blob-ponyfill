import BlobImpl, { $$merged } from './blob';
import { bufferToText, bufferToDataURL, bufferToBinaryString } from './transform';


export default class FileReaderSyncImpl implements FileReaderSync {
    public readAsArrayBuffer(blob: BlobImpl): ArrayBuffer {
        return blob[$$merged].buffer;
    }

    public readAsBinaryString(blob: BlobImpl): string {
        return bufferToBinaryString(blob[$$merged]);
    }

    public readAsDataURL(blob: BlobImpl): string {
        return bufferToDataURL(blob.type, blob[$$merged]);
    }

    public readAsText(blob: BlobImpl, encoding?: string | undefined): string {
        return bufferToText(encoding, blob[$$merged]);
    }
}
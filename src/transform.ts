export function bufferToBinaryString(buf: Uint8Array): string {
    return Array.from(buf, (c) => String.fromCharCode(c)).join('');
}

export function bufferToDataURL(type: string, buf: Uint8Array): string {
    return 'data:' + type + ';base64,' + btoa(bufferToBinaryString(buf));
}

export function bufferToText(encoding: string | undefined, buf: Uint8Array): string {
    return new TextDecoder(encoding).decode(buf);
}

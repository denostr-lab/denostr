import { createHmac } from 'node:crypto'

import { Buffer } from 'Buffer'

import Config from '../config/index.ts'

export function deriveFromSecret(purpose: string | Buffer): Buffer {
    return hmacSha256(Config.SECRET as string, purpose)
}

export function hmacSha256(secret: string | Buffer, data: string | Buffer): Buffer {
    return createHmac('sha256', secret)
        .update(data)
        .digest()
}

import { Buffer } from 'Buffer'
import { createHmac } from 'crypto'

import Config from '../config/index.ts'

export function deriveFromSecret(purpose: string | Buffer): Buffer {
    if (!Config.SECRET) {
        throw new Error('SECRET environment variable not set')
    }

    return hmacSha256(Config.SECRET, purpose)
}

export function hmacSha256(
    secret: string | Buffer,
    data: string | Buffer,
): Buffer {
    return createHmac('sha256', secret)
        .update(data)
        .digest()
}

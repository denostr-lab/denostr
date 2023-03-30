import { expect } from 'chai'
import { describe, it } from 'jest'
import { InMemmoryCacheAdapter } from '../../../src/adapters/inmemory-cache-adapter.ts'

describe({
    name: 'delegatedEventStrategyFactory',
    fn: () => {
        const cache = new InMemmoryCacheAdapter()
        const initTime = 1680168081390
        const SECOND = 1000
        const key = 'some_key'
        const period = 10000
        const rate = 5

        async function hit(timestamp: number, period: number, key: string, step: number) {
            const [, , entries] = await Promise.all([
                cache.removeRangeByScoreFromSortedSet(key, 0, timestamp - period),
                cache.addToSortedSet(key, {
                    [`${timestamp}:${step}`]: timestamp.toString(),
                }, period),
                cache.getRangeFromSortedSet(key, 0, -1),
                cache.setKeyExpiry(key, period),
            ])

            const hits = entries.reduce(
                (acc, timestampAndStep) => acc + Number(timestampAndStep.split(':')[1]),
                0,
            )

            return hits > rate
        }

        it('SlidingWindowRateLimiter be to hit', async () => {
            const arr = await Promise.all([0, 1, 2].map((n) => hit(initTime + (n * SECOND), period, key, 1)))

            expect(arr[0]).eq(false)
            expect(arr[1]).eq(false)
            expect(arr[2]).eq(false)
        })

        it('SlidingWindowRateLimiter hit limited', async () => {
            const time = initTime + 3 * SECOND
            expect(await hit(time, period, key, 1)).eq(false)
            expect(await hit(time + SECOND, period, key, 5)).eq(true)
        })

        it('SlidingWindowRateLimiter wait for 10s to leave the window', async () => {
            await new Promise((resolve) => setTimeout(resolve, 10 * 1000))

            const time = initTime + 20 * SECOND
            expect(await hit(time, period, key, 1)).eq(false)
            expect(await hit(time + SECOND, period, key, 1)).eq(false)
        })
    },
    sanitizeOps: false,
    sanitizeResources: false,
})

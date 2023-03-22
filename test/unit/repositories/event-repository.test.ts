import * as chai from 'chai'
import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'jest'
import * as sinon from 'sinon'
import sinonChai from 'sinon-chai'
// import { Event, ParameterizedReplaceableEvent } from '../../../src/@types/event.ts'

import { Event } from '../../../src/@types/event.ts'
import { IEventRepository } from '../../../src/@types/repositories.ts'
import { SubscriptionFilter } from '../../../src/@types/subscription.ts'

chai.use(sinonChai)

const { expect } = chai

import { DatabaseClient1 as DatabaseClient } from '../../../src/@types/base.ts'
// import { ContextMetadataKey, EventDeduplicationMetadataKey } from '../../../src/constants/base.ts'
import { EventRepository } from '../../../src/repositories/event-repository.ts'
import { getMasterDbClient } from '../../../src/database/client.ts'
// import { masterEventsModel } from '../../../src/database/models/Events.ts'

describe({
    name: 'EventRepository',
    fn: () => {
        let repository: IEventRepository
        let sandbox: sinon.SinonSandbox
        let dbClient: DatabaseClient

        beforeAll(async () => {
            dbClient = getMasterDbClient()
            dbClient = await dbClient.asPromise()
        })
        afterAll(() => {
            dbClient.destroy()
        })
        beforeEach(async () => {
            sandbox = sinon.createSandbox()
            repository = new EventRepository()
        })

        afterEach(() => {
            sandbox.restore()
        })

        describe('.findByFilters', () => {
            it('returns a function with stream and then', () => {
                expect(repository.findByFilters([{}])).to.have.property('cursor')
            })

            it('throws error if filters is empty', () => {
                expect(() => repository.findByFilters([])).to.throw(
                    Error,
                    'Filters cannot be empty',
                )
            })

            describe('1 filter', () => {
                it('selects all events', () => {
                    const filters = [{}]

                    const query = repository.findByFilters(filters)

                    expect(JSON.stringify(query.pipeline())).to.equal('[{"$match":{}},{"$sort":{"event_created_at":1}},{"$limit":500}]')
                })

                describe('authors', () => {
                    it('selects no events given empty list of authors', () => {
                        const filters: SubscriptionFilter[] = [{ authors: [] }]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            '[{"$match":{"$or":[{"event_pubkey":{"$in":[]}},{"event_delegator":{"$in":[]}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]',
                        )
                    })

                    it('selects events by one author', () => {
                        const filters = [{
                            authors: [
                                '22e804d26ed16b68db5259e78449e96dab5d464c8f470bda3eb1a70467f2c793',
                            ],
                        }]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            `[{"$match":{"$or":[{"event_pubkey":{"$in":[{"type":"Buffer","data":[34,232,4,210,110,209,107,104,219,82,89,231,132,73,233,109,171,93,70,76,143,71,11,218,62,177,167,4,103,242,199,147]}]}},{"event_delegator":{"$in":[{"type":"Buffer","data":[34,232,4,210,110,209,107,104,219,82,89,231,132,73,233,109,171,93,70,76,143,71,11,218,62,177,167,4,103,242,199,147]}]}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]`,
                        )
                    })

                    it('selects events by two authors', () => {
                        const filters = [
                            {
                                authors: [
                                    '22e804d26ed16b68db5259e78449e96dab5d464c8f470bda3eb1a70467f2c793',
                                    '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245',
                                ],
                            },
                        ]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            `[{"$match":{"$or":[{"event_pubkey":{"$in":[{"type":"Buffer","data":[34,232,4,210,110,209,107,104,219,82,89,231,132,73,233,109,171,93,70,76,143,71,11,218,62,177,167,4,103,242,199,147]},{"type":"Buffer","data":[50,225,130,118,53,69,14,187,60,90,125,18,193,248,231,178,181,20,67,154,193,10,103,238,243,217,253,156,92,104,226,69]}]}},{"event_delegator":{"$in":[{"type":"Buffer","data":[34,232,4,210,110,209,107,104,219,82,89,231,132,73,233,109,171,93,70,76,143,71,11,218,62,177,167,4,103,242,199,147]},{"type":"Buffer","data":[50,225,130,118,53,69,14,187,60,90,125,18,193,248,231,178,181,20,67,154,193,10,103,238,243,217,253,156,92,104,226,69]}]}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]`,
                        )
                    })

                    it('selects events by one author prefix (even length)', () => {
                        const filters = [
                            {
                                authors: [
                                    '22e804',
                                ],
                            },
                        ]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            `[{"$match":{"$or":[{"event_pubkey":{"$in":[{"type":"Buffer","data":[34,232,4]}]}},{"event_delegator":{"$in":[{"type":"Buffer","data":[34,232,4]}]}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]`,
                        )
                    })

                    it('selects events by one author prefix (odd length)', () => {
                        const filters = [
                            {
                                authors: [
                                    '22e804f',
                                ],
                            },
                        ]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            `[{"$match":{"$or":[{"event_pubkey":{"$in":[{"type":"Buffer","data":[34,232,4]}]}},{"event_delegator":{"$in":[{"type":"Buffer","data":[34,232,4]}]}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]`,
                        )
                    })

                    it('selects events by two author prefix (first even, second odd)', () => {
                        const filters = [
                            {
                                authors: [
                                    '22e804',
                                    '32e1827',
                                ],
                            },
                        ]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            `[{"$match":{"$or":[{"event_pubkey":{"$in":[{"type":"Buffer","data":[34,232,4]},{"type":"Buffer","data":[50,225,130]}]}},{"event_delegator":{"$in":[{"type":"Buffer","data":[34,232,4]},{"type":"Buffer","data":[50,225,130]}]}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]`,
                        )
                    })
                })

                describe('ids', () => {
                    it('selects no events given empty list of ids', () => {
                        const filters: SubscriptionFilter[] = [{ ids: [] }]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            '[{"$match":{"$and":[{"event_id":{"$in":[]}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]',
                        )
                    })

                    it('selects events by one id', () => {
                        const filters = [{
                            ids: [
                                'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                            ],
                        }]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            `[{"$match":{"$and":[{"event_id":{"$in":[{"type":"Buffer","data":[170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170]}]}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]`,
                        )
                    })

                    it('selects events by two ids', () => {
                        const filters = [
                            {
                                ids: [
                                    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                                    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
                                ],
                            },
                        ]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            `[{"$match":{"$and":[{"event_id":{"$in":[{"type":"Buffer","data":[170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170]},{"type":"Buffer","data":[187,187,187,187,187,187,187,187,187,187,187,187,187,187,187,187,187,187,187,187,187,187,187,187,187,187,187,187,187,187,187,187]}]}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]`,
                        )
                    })

                    it('selects events by one id prefix (even length)', () => {
                        const filters = [
                            {
                                ids: [
                                    'abcd',
                                ],
                            },
                        ]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            `[{"$match":{"$and":[{"event_id":{"$in":[{"type":"Buffer","data":[171,205]}]}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]`,
                        )
                    })

                    it('selects events by one id prefix (odd length)', () => {
                        const filters = [
                            {
                                ids: [
                                    'abc',
                                ],
                            },
                        ]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            `[{"$match":{"$and":[{"event_id":{"$in":[{"type":"Buffer","data":[171]}]}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]`,
                        )
                    })

                    it('selects events by two id prefix (first even, second odd)', () => {
                        const filters = [
                            {
                                ids: [
                                    'abcdef',
                                    'abc',
                                ],
                            },
                        ]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            `[{"$match":{"$and":[{"event_id":{"$in":[{"type":"Buffer","data":[171,205,239]},{"type":"Buffer","data":[171]}]}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]`,
                        )
                    })
                })

                describe('kinds', () => {
                    it('selects no events given empty list of kinds', () => {
                        const filters: SubscriptionFilter[] = [{ kinds: [] }]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            '[{"$match":{"$and":[{"event_kind":{"$in":[]}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]',
                        )
                    })

                    it('selects events by one kind', () => {
                        const filters = [{ kinds: [1] }]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            '[{"$match":{"$and":[{"event_kind":{"$in":[1]}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]',
                        )
                    })

                    it('selects events by two kinds', () => {
                        const filters = [{ kinds: [1, 2] }]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            '[{"$match":{"$and":[{"event_kind":{"$in":[1,2]}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]',
                        )
                    })
                })

                describe('since', () => {
                    it('selects events since given timestamp', () => {
                        const filters = [{ since: 1000 }]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            '[{"$match":{"$and":[{"event_created_at":{"$gte":1000}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]',
                        )
                    })
                })

                describe('until', () => {
                    it('selects events until given timestamp', () => {
                        const filters = [{ until: 1000 }]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            '[{"$match":{"$and":[{"event_created_at":{"$lte":1000}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]',
                        )
                    })
                })

                describe('limit', () => {
                    it('selects 1000 events', () => {
                        const filters = [{ limit: 1000 }]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            '[{"$match":{}},{"$sort":{"event_created_at":-1}},{"$limit":1000}]',
                        )
                    })
                })

                describe('#e', () => {
                    it('selects no events given empty list of #e tags', () => {
                        const filters = [{ '#e': [] }]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            '[{"$match":{"$and":[{"event_tags":{"$elemMatch":{"$eq":["e"]}}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]',
                        )
                    })

                    it('selects events by one #e tag', () => {
                        const filters = [{ '#e': ['aaaaaa'] }]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            `[{"$match":{"$and":[{"event_tags":{"$elemMatch":{"$eq":["e","aaaaaa"]}}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]`,
                        )
                    })

                    it('selects events by two #e tag', () => {
                        const filters = [{ '#e': ['aaaaaa', 'bbbbbb'] }]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            `[{"$match":{"$and":[{"event_tags":{"$elemMatch":{"$eq":["e","aaaaaa","bbbbbb"]}}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]`,
                        )
                    })
                })

                describe('#p', () => {
                    it('selects no events given empty list of #p tags', () => {
                        const filters = [{ '#p': [] }]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            '[{"$match":{"$and":[{"event_tags":{"$elemMatch":{"$eq":["p"]}}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]',
                        )
                    })

                    it('selects events by one #p tag', () => {
                        const filters = [{ '#p': ['aaaaaa'] }]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            `[{"$match":{"$and":[{"event_tags":{"$elemMatch":{"$eq":["p","aaaaaa"]}}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]`,
                        )
                    })

                    it('selects events by two #p tag', () => {
                        const filters = [{ '#p': ['aaaaaa', 'bbbbbb'] }]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            `[{"$match":{"$and":[{"event_tags":{"$elemMatch":{"$eq":["p","aaaaaa","bbbbbb"]}}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]`,
                        )
                    })
                })

                describe('#r', () => {
                    it('selects no events given empty list of #r tags', () => {
                        const filters = [{ '#r': [] }]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            '[{"$match":{"$and":[{"event_tags":{"$elemMatch":{"$eq":["r"]}}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]',
                        )
                    })

                    it('selects events by one #r tag', () => {
                        const filters = [{ '#r': ['aaaaaa'] }]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            `[{"$match":{"$and":[{"event_tags":{"$elemMatch":{"$eq":["r","aaaaaa"]}}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]`,
                        )
                    })

                    it('selects events by two #r tag', () => {
                        const filters = [{ '#r': ['aaaaaa', 'bbbbbb'] }]

                        const query = repository.findByFilters(filters)

                        expect(JSON.stringify(query.pipeline())).to.equal(
                            `[{"$match":{"$and":[{"event_tags":{"$elemMatch":{"$eq":["r","aaaaaa","bbbbbb"]}}}]}},{"$sort":{"event_created_at":1}},{"$limit":500}]`,
                        )
                    })
                })
            })

            describe('2 filters', () => {
                it('selects union of both filters', () => {
                    const filters = [{}, {}]

                    const query = repository.findByFilters(filters)

                    expect(JSON.stringify(query.pipeline())).to.equal(
                        '[{"$match":{}},{"$sort":{"event_created_at":1}},{"$limit":500}]',
                    )
                })
            })

            describe('many filters', () => {
                it('selects union of all filters', () => {
                    const filters = [
                        { kinds: [1] },
                        { ids: ['aaaaa'] },
                        { authors: ['bbbbb'] },
                        { since: 1000 },
                        { until: 1000 },
                        { limit: 1000 },
                    ]

                    const query = repository.findByFilters(filters)

                    expect(JSON.stringify(query.pipeline())).to.equal(
                        `[{"$match":{"$and":[{"event_created_at":{"$gte":1000}},{"event_created_at":{"$lte":1000}}],"$or":[{"event_kind":{"$in":[1]}},{"event_id":{"$in":[{"type":"Buffer","data":[170,170]}]}},{"event_pubkey":{"$in":[{"type":"Buffer","data":[187,187]}]}},{"event_delegator":{"$in":[{"type":"Buffer","data":[187,187]}]}}]}},{"$sort":{"event_created_at":-1}},{"$limit":1000}]`,
                    )
                })
            })
        })

        describe('.create', () => {
            let insertStub: sinon.SinonStub
            beforeEach(() => {
                insertStub = sandbox.stub(repository, 'insert' as any)
            })

            it('calls insert with given event and returns row count', async () => {
                const event: Event = {
                    id: '6b3cdd0302ded8068ad3f0269c74423ca4fee460f800f3d90103b63f14400407',
                    pubkey: '22e804d26ed16b68db5259e78449e96dab5d464c8f470bda3eb1a70467f2c793',
                    created_at: 1648351380,
                    kind: 1,
                    tags: [
                        [
                            'p',
                            '8355095016fddbe31fcf1453b26f613553e9758cf2263e190eac8fd96a3d3de9',
                            'wss://nostr-pub.wellorder.net',
                        ],
                        [
                            'e',
                            '7377fa81fc6c7ae7f7f4ef8938d4a603f7bf98183b35ab128235cc92d4bebf96',
                            'wss://nostr-relay.untethr.me',
                        ],
                    ],
                    content: `I've set up mirroring between relays: https://i.imgur.com/HxCDipB.png`,
                    sig: 'b37adfed0e6398546d623536f9ddc92b95b7dc71927e1123266332659253ecd0ffa91ddf2c0a82a8426c5b363139d28534d6cac893b8a810149557a3f6d36768',
                }

                insertStub.returns({ then: sinon.stub().yields({ rowCount: 1 }) })

                const result = await repository.create(event)

                expect(insertStub).to.have.been.calledOnceWithExactly(event)
                expect(result).to.equal(1)
            })
        })

        // describe('.insert', () => {
        //     it('inserts event if there is no conflict', () => {
        //         const event: Event = {
        //             id: '6b3cdd0302ded8068ad3f0269c74423ca4fee460f800f3d90103b63f14400407',
        //             pubkey: '22e804d26ed16b68db5259e78449e96dab5d464c8f470bda3eb1a70467f2c793',
        //             created_at: 1648351380,
        //             kind: 1,
        //             tags: [
        //                 [
        //                     'p',
        //                     '8355095016fddbe31fcf1453b26f613553e9758cf2263e190eac8fd96a3d3de9',
        //                     'wss://nostr-pub.wellorder.net',
        //                 ],
        //                 [
        //                     'e',
        //                     '7377fa81fc6c7ae7f7f4ef8938d4a603f7bf98183b35ab128235cc92d4bebf96',
        //                     'wss://nostr-relay.untethr.me',
        //                 ],
        //             ],
        //             content: 'I've set up mirroring between relays: https://i.imgur.com/HxCDipB.png',
        //             sig: 'b37adfed0e6398546d623536f9ddc92b95b7dc71927e1123266332659253ecd0ffa91ddf2c0a82a8426c5b363139d28534d6cac893b8a810149557a3f6d36768',
        //             [ContextMetadataKey]: { remoteAddress: { address: '::1' } as any },
        //         }

        //         const query = (repository as any).insert(event).toString()

        //         expect(query).to.equal(
        //             `insert into "events" ("event_content", "event_created_at", "event_delegator", "event_id", "event_kind", "event_pubkey", "event_signature", "event_tags", "expires_at", "remote_address") values ('I''ve set up mirroring between relays: https://i.imgur.com/HxCDipB.png', 1648351380, NULL, X'6b3cdd0302ded8068ad3f0269c74423ca4fee460f800f3d90103b63f14400407', 1, X'22e804d26ed16b68db5259e78449e96dab5d464c8f470bda3eb1a70467f2c793', X'b37adfed0e6398546d623536f9ddc92b95b7dc71927e1123266332659253ecd0ffa91ddf2c0a82a8426c5b363139d28534d6cac893b8a810149557a3f6d36768', '[["p","8355095016fddbe31fcf1453b26f613553e9758cf2263e190eac8fd96a3d3de9","wss://nostr-pub.wellorder.net"],["e","7377fa81fc6c7ae7f7f4ef8938d4a603f7bf98183b35ab128235cc92d4bebf96","wss://nostr-relay.untethr.me"]]', NULL, '::1') on conflict do nothing`,
        //         )
        //     })
        // })

        // describe('insertStubs', () => {
        //     let clock: sinon.SinonFakeTimers

        //     beforeEach(() => {
        //         clock = sinon.useFakeTimers(1673835425)
        //     })

        //     afterEach(() => {
        //         clock.restore()
        //     })

        //     it('insert stubs by pubkey & event ids', () => {
        //         const query = repository.insertStubs('001122', ['aabbcc', 'ddeeff'])
        //             .toString()

        //         expect(query).to.equal(
        //             `insert into "events" ("deleted_at", "event_content", "event_created_at", "event_deduplication", "event_delegator", "event_id", "event_kind", "event_pubkey", "event_signature", "event_tags", "expires_at") values ('1970-01-20T08:57:15.425Z', '', 1673835, '["001122",5]', NULL, X'aabbcc', 5, X'001122', X'', '[]', NULL), ('1970-01-20T08:57:15.425Z', '', 1673835, '["001122",5]', NULL, X'ddeeff', 5, X'001122', X'', '[]', NULL) on conflict do nothing`,
        //         )
        //     })
        // })

        // describe('deleteByPubkeyAndIds', async() => {
        //     it('marks event as deleted by pubkey & event_id if not deleted', async() => {
        //         const query = await repository.deleteByPubkeyAndIds('001122', [
        //             'aabbcc',
        //             'ddeeff',
        //         ]).toString()

        //         expect(JSON.stringify(query)).to.equal(
        //             `update "events" set "deleted_at" = now() where "event_pubkey" = X'001122' and "event_id" in (X'aabbcc', X'ddeeff') and "deleted_at" is null`,
        //         )
        //     })
        // })

        // describe('upsert', () => {
        //     it('replaces event based on event_pubkey and event_kind', () => {
        //         const event: Event = {
        //             'id': 'e527fe8b0f64a38c6877f943a9e8841074056ba72aceb31a4c85e6d10b27095a',
        //             'pubkey': '55b702c167c85eb1c2d5ab35d68bedd1a35b94c01147364d2395c2f66f35a503',
        //             'created_at': 1564498626,
        //             'kind': 0,
        //             'tags': [],
        //             'content': '{"name":"ottman@minds.io","about":"","picture":"https://feat-2311-nostr.minds.io/icon/1002952989368913934/medium/1564498626/1564498626/1653379539"}',
        //             'sig': 'd1de98733de2b412549aa64454722d9b66ab3c68e9e0d0f9c5d42e7bd54c30a06174364b683d2c8dbb386ff47f31e6cb7e2f3c3498d8819ee80421216c8309a9',
        //             [ContextMetadataKey]: { remoteAddress: { address: '::1' } as any },
        //         }

        //         const query = repository.upsert(event).toString()

        //         expect(JSON.stringify(query)).to.equal(
        //             `insert into "events" ("event_content", "event_created_at", "event_deduplication", "event_delegator", "event_id", "event_kind", "event_pubkey", "event_signature", "event_tags", "expires_at", "remote_address") values ('{"name":"ottman@minds.io","about":"","picture":"https://feat-2311-nostr.minds.io/icon/1002952989368913934/medium/1564498626/1564498626/1653379539"}', 1564498626, '["55b702c167c85eb1c2d5ab35d68bedd1a35b94c01147364d2395c2f66f35a503",0]', NULL, X'e527fe8b0f64a38c6877f943a9e8841074056ba72aceb31a4c85e6d10b27095a', 0, X'55b702c167c85eb1c2d5ab35d68bedd1a35b94c01147364d2395c2f66f35a503', X'd1de98733de2b412549aa64454722d9b66ab3c68e9e0d0f9c5d42e7bd54c30a06174364b683d2c8dbb386ff47f31e6cb7e2f3c3498d8819ee80421216c8309a9', '[]', NULL, '::1') on conflict (event_pubkey, event_kind, event_deduplication) WHERE (event_kind = 0 OR event_kind = 3 OR event_kind = 41 OR (event_kind >= 10000 AND event_kind < 20000)) OR (event_kind >= 30000 AND event_kind < 40000) do update set "event_id" = X'e527fe8b0f64a38c6877f943a9e8841074056ba72aceb31a4c85e6d10b27095a',"event_created_at" = 1564498626,"event_tags" = '[]',"event_content" = '{"name":"ottman@minds.io","about":"","picture":"https://feat-2311-nostr.minds.io/icon/1002952989368913934/medium/1564498626/1564498626/1653379539"}',"event_signature" = X'd1de98733de2b412549aa64454722d9b66ab3c68e9e0d0f9c5d42e7bd54c30a06174364b683d2c8dbb386ff47f31e6cb7e2f3c3498d8819ee80421216c8309a9',"event_delegator" = NULL,"remote_address" = '::1',"expires_at" = NULL where "events"."event_created_at" < 1564498626`,
        //         )
        //     })

        //     it('replaces event based on event_pubkey, event_kind and event_deduplication', async() => {
        //         const event: ParameterizedReplaceableEvent = {
        //             'id': 'e527fe8b0f64a38c6877f943a9e8841074056ba72aceb31a4c85e6d10b27095a',
        //             'pubkey': '55b702c167c85eb1c2d5ab35d68bedd1a35b94c01147364d2395c2f66f35a503',
        //             'created_at': 1564498626,
        //             'kind': 0,
        //             'tags': [],
        //             [EventDeduplicationMetadataKey]: ['deduplication'],
        //             [ContextMetadataKey]: { remoteAddress: { address: '::1' } as any },
        //             'content': '{"name":"ottman@minds.io","about":"","picture":"https://feat-2311-nostr.minds.io/icon/1002952989368913934/medium/1564498626/1564498626/1653379539"}',
        //             'sig': 'd1de98733de2b412549aa64454722d9b66ab3c68e9e0d0f9c5d42e7bd54c30a06174364b683d2c8dbb386ff47f31e6cb7e2f3c3498d8819ee80421216c8309a9',
        //         }
        //         const query = repository.upsert(event).toString()

        //         expect(JSON.stringify(query)).to.equal(
        //             `insert into "events" ("event_content", "event_created_at", "event_deduplication", "event_delegator", "event_id", "event_kind", "event_pubkey", "event_signature", "event_tags", "expires_at", "remote_address") values ('{"name":"ottman@minds.io","about":"","picture":"https://feat-2311-nostr.minds.io/icon/1002952989368913934/medium/1564498626/1564498626/1653379539"}', 1564498626, '["deduplication"]', NULL, X'e527fe8b0f64a38c6877f943a9e8841074056ba72aceb31a4c85e6d10b27095a', 0, X'55b702c167c85eb1c2d5ab35d68bedd1a35b94c01147364d2395c2f66f35a503', X'd1de98733de2b412549aa64454722d9b66ab3c68e9e0d0f9c5d42e7bd54c30a06174364b683d2c8dbb386ff47f31e6cb7e2f3c3498d8819ee80421216c8309a9', '[]', NULL, '::1') on conflict (event_pubkey, event_kind, event_deduplication) WHERE (event_kind = 0 OR event_kind = 3 OR event_kind = 41 OR (event_kind >= 10000 AND event_kind < 20000)) OR (event_kind >= 30000 AND event_kind < 40000) do update set "event_id" = X'e527fe8b0f64a38c6877f943a9e8841074056ba72aceb31a4c85e6d10b27095a',"event_created_at" = 1564498626,"event_tags" = '[]',"event_content" = '{"name":"ottman@minds.io","about":"","picture":"https://feat-2311-nostr.minds.io/icon/1002952989368913934/medium/1564498626/1564498626/1653379539"}',"event_signature" = X'd1de98733de2b412549aa64454722d9b66ab3c68e9e0d0f9c5d42e7bd54c30a06174364b683d2c8dbb386ff47f31e6cb7e2f3c3498d8819ee80421216c8309a9',"event_delegator" = NULL,"remote_address" = '::1',"expires_at" = NULL where "events"."event_created_at" < 1564498626`,
        //         )
        //     })
        // })
    },
    sanitizeResources: false,
    sanitizeOps: false,
})

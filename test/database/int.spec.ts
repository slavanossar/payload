import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { PostgresAdapter } from '@payloadcms/db-postgres/types'
import type { NextRESTClient } from 'helpers/NextRESTClient.js'
import type {
  DataFromCollectionSlug,
  Payload,
  PayloadRequest,
  TypeWithID,
  ValidationError,
} from 'payload'

import {
  migrateRelationshipsV2_V3,
  migrateVersionsV1_V2,
} from '@payloadcms/db-mongodb/migration-utils'
import { randomUUID } from 'crypto'
import * as drizzlePg from 'drizzle-orm/pg-core'
import * as drizzleSqlite from 'drizzle-orm/sqlite-core'
import fs from 'fs'
import mongoose, { Types } from 'mongoose'
import path from 'path'
import {
  commitTransaction,
  initTransaction,
  isolateObjectProperty,
  killTransaction,
  QueryError,
} from 'payload'
import { assert } from 'ts-essentials'
import { fileURLToPath } from 'url'

import type { Global2 } from './payload-types.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { isMongoose } from '../helpers/isMongoose.js'
import removeFiles from '../helpers/removeFiles.js'
import { seed } from './seed.js'
import { errorOnUnnamedFieldsSlug, fieldsPersistanceSlug, postsSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload
let user: Record<string, unknown> & TypeWithID
let token: string
let restClient: NextRESTClient
const collection = postsSlug
const title = 'title'
process.env.PAYLOAD_CONFIG_PATH = path.join(dirname, 'config.ts')

describe('database', () => {
  beforeAll(async () => {
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, restClient } = await initPayloadInt(dirname))
    payload.db.migrationDir = path.join(dirname, './migrations')

    await seed(payload)

    await restClient.login({
      slug: 'users',
      credentials: devUser,
    })

    const loginResult = await payload.login({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    user = loginResult.user
    token = loginResult.token
  })

  afterAll(async () => {
    await payload.destroy()
  })

  describe('id type', () => {
    it('should sanitize incoming IDs if ID type is number', async () => {
      const created = await restClient
        .POST(`/posts`, {
          body: JSON.stringify({
            title: 'post to test that ID comes in as proper type',
          }),
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => res.json())

      const { doc: updated } = await restClient
        .PATCH(`/posts/${created.doc.id}`, {
          body: JSON.stringify({
            title: 'hello',
          }),
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => res.json())

      expect(updated.id).toStrictEqual(created.doc.id)
    })

    it('should create with generated ID text from hook', async () => {
      const doc = await payload.create({
        collection: 'custom-ids',
        data: {},
      })

      expect(doc.id).toBeDefined()
    })

    it('should not create duplicate versions with custom id type', async () => {
      const doc = await payload.create({
        collection: 'custom-ids',
        data: {
          title: 'hey',
        },
      })

      await payload.update({
        collection: 'custom-ids',
        id: doc.id,
        data: {},
      })

      await payload.update({
        collection: 'custom-ids',
        id: doc.id,
        data: {},
      })

      const versionsQuery = await payload.db.findVersions({
        collection: 'custom-ids',
        req: {} as PayloadRequest,
        where: {
          'version.title': {
            equals: 'hey',
          },
          latest: {
            equals: true,
          },
        },
      })

      expect(versionsQuery.totalDocs).toStrictEqual(1)
    })

    it('should not accidentally treat nested id fields as custom id', () => {
      expect(payload.collections['fake-custom-ids'].customIDType).toBeUndefined()
    })

    it('should not overwrite supplied block and array row IDs on create', async () => {
      const arrayRowID = '67648ed5c72f13be6eacf24e'
      const blockID = '6764de9af79a863575c5f58c'

      const doc = await payload.create({
        collection: postsSlug,
        data: {
          title: 'test',
          arrayWithIDs: [
            {
              id: arrayRowID,
            },
          ],
          blocksWithIDs: [
            {
              blockType: 'block-first',
              id: blockID,
            },
          ],
        },
      })

      expect(doc.arrayWithIDs[0].id).toStrictEqual(arrayRowID)
      expect(doc.blocksWithIDs[0].id).toStrictEqual(blockID)
    })

    it('should overwrite supplied block and array row IDs on duplicate', async () => {
      const arrayRowID = '6764deb5201e9e36aeba3b6c'
      const blockID = '6764dec58c68f337a758180c'

      const doc = await payload.create({
        collection: postsSlug,
        data: {
          title: 'test',
          arrayWithIDs: [
            {
              id: arrayRowID,
            },
          ],
          blocksWithIDs: [
            {
              blockType: 'block-first',
              id: blockID,
            },
          ],
        },
      })

      const duplicate = await payload.duplicate({
        collection: postsSlug,
        id: doc.id,
      })

      expect(duplicate.arrayWithIDs[0].id).not.toStrictEqual(arrayRowID)
      expect(duplicate.blocksWithIDs[0].id).not.toStrictEqual(blockID)
    })
  })

  describe('timestamps', () => {
    it('should have createdAt and updatedAt timestamps to the millisecond', async () => {
      const result = await payload.create({
        collection: postsSlug,
        data: {
          title: 'hello',
        },
      })

      const createdAtDate = new Date(result.createdAt)

      expect(createdAtDate.getMilliseconds()).toBeDefined()
    })

    it('should allow createdAt to be set in create', async () => {
      const createdAt = new Date('2021-01-01T00:00:00.000Z').toISOString()
      const result = await payload.create({
        collection: postsSlug,
        data: {
          createdAt,
          title: 'hello',
        },
      })

      const doc = await payload.findByID({
        id: result.id,
        collection: postsSlug,
      })

      expect(result.createdAt).toStrictEqual(createdAt)
      expect(doc.createdAt).toStrictEqual(createdAt)
    })

    it('updatedAt cannot be set in create', async () => {
      const updatedAt = new Date('2022-01-01T00:00:00.000Z').toISOString()
      const result = await payload.create({
        collection: postsSlug,
        data: {
          title: 'hello',
          updatedAt,
        },
      })

      expect(result.updatedAt).not.toStrictEqual(updatedAt)
    })
  })

  describe('Data strictness', () => {
    it('should not save and leak password, confirm-password from Local API', async () => {
      const createdUser = await payload.create({
        collection: 'users',
        data: {
          password: 'some-password',
          // @ts-expect-error
          'confirm-password': 'some-password',
          email: 'user1@payloadcms.com',
        },
      })

      let keys = Object.keys(createdUser)

      expect(keys).not.toContain('password')
      expect(keys).not.toContain('confirm-password')

      const foundUser = await payload.findByID({ id: createdUser.id, collection: 'users' })

      keys = Object.keys(foundUser)

      expect(keys).not.toContain('password')
      expect(keys).not.toContain('confirm-password')
    })

    it('should not save and leak password, confirm-password from payload.db', async () => {
      const createdUser = await payload.db.create({
        collection: 'users',
        data: {
          password: 'some-password',
          'confirm-password': 'some-password',
          email: 'user2@payloadcms.com',
        },
      })

      let keys = Object.keys(createdUser)

      expect(keys).not.toContain('password')
      expect(keys).not.toContain('confirm-password')

      const foundUser = await payload.db.findOne({
        collection: 'users',
        where: { id: createdUser.id },
      })

      keys = Object.keys(foundUser)
      expect(keys).not.toContain('password')
      expect(keys).not.toContain('confirm-password')
    })
  })

  describe('allow ID on create', () => {
    beforeAll(() => {
      payload.db.allowIDOnCreate = true
      payload.config.db.allowIDOnCreate = true
    })

    afterAll(() => {
      payload.db.allowIDOnCreate = false
      payload.config.db.allowIDOnCreate = false
    })

    it('local API - accepts ID on create', async () => {
      let id: any = null
      if (payload.db.name === 'mongoose') {
        id = new mongoose.Types.ObjectId().toHexString()
      } else if (payload.db.idType === 'uuid') {
        id = randomUUID()
      } else {
        id = 9999
      }

      const post = await payload.create({ collection: 'posts', data: { id, title: 'created' } })

      expect(post.id).toBe(id)
    })

    it('rEST API - accepts ID on create', async () => {
      let id: any = null
      if (payload.db.name === 'mongoose') {
        id = new mongoose.Types.ObjectId().toHexString()
      } else if (payload.db.idType === 'uuid') {
        id = randomUUID()
      } else {
        id = 99999
      }

      const response = await restClient.POST(`/posts`, {
        body: JSON.stringify({
          id,
          title: 'created',
        }),
      })

      const post = await response.json()

      expect(post.doc.id).toBe(id)
    })

    it('graphQL - accepts ID on create', async () => {
      let id: any = null
      if (payload.db.name === 'mongoose') {
        id = new mongoose.Types.ObjectId().toHexString()
      } else if (payload.db.idType === 'uuid') {
        id = randomUUID()
      } else {
        id = 999999
      }

      const query = `mutation {
                createPost(data: {title: "created", id: ${typeof id === 'string' ? `"${id}"` : id}}) {
                id
                title
              }
            }`
      const res = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())

      const doc = res.data.createPost

      expect(doc).toMatchObject({ title: 'created', id })
      expect(doc.id).toBe(id)
    })
  })

  it('should find distinct field values of the collection', async () => {
    await payload.delete({ collection: 'posts', where: {} })
    const titles = [
      'title-1',
      'title-2',
      'title-3',
      'title-4',
      'title-5',
      'title-6',
      'title-7',
      'title-8',
      'title-9',
    ].map((title) => ({ title }))

    for (const { title } of titles) {
      // eslint-disable-next-line jest/no-conditional-in-test
      const docsCount = Math.random() > 0.5 ? 3 : Math.random() > 0.5 ? 2 : 1
      for (let i = 0; i < docsCount; i++) {
        await payload.create({ collection: 'posts', data: { title } })
      }
    }

    const res = await payload.findDistinct({
      collection: 'posts',
      field: 'title',
    })

    expect(res.values).toStrictEqual(titles)

    // const resREST = await restClient
    //   .GET('/posts/distinct', {
    //     headers: {
    //       Authorization: `Bearer ${token}`,
    //     },
    //     query: { sortOrder: 'asc', field: 'title' },
    //   })
    //   .then((res) => res.json())

    // expect(resREST.values).toEqual(titles)

    const resLimit = await payload.findDistinct({
      collection: 'posts',
      field: 'title',
      limit: 3,
    })

    expect(resLimit.values).toStrictEqual(
      ['title-1', 'title-2', 'title-3'].map((title) => ({ title })),
    )
    // count is still 9
    expect(resLimit.totalDocs).toBe(9)

    const resDesc = await payload.findDistinct({
      collection: 'posts',
      sort: '-title',
      field: 'title',
    })

    expect(resDesc.values).toStrictEqual(titles.toReversed())

    const resAscDefault = await payload.findDistinct({
      collection: 'posts',
      field: 'title',
    })

    expect(resAscDefault.values).toStrictEqual(titles)
  })

  it('should populate distinct relationships when depth>0', async () => {
    await payload.delete({ collection: 'posts', where: {} })

    const categories = ['category-1', 'category-2', 'category-3', 'category-4'].map((title) => ({
      title,
    }))

    const categoriesIDS: { category: string }[] = []

    for (const { title } of categories) {
      const doc = await payload.create({ collection: 'categories', data: { title } })
      categoriesIDS.push({ category: doc.id })
    }

    for (const { category } of categoriesIDS) {
      // eslint-disable-next-line jest/no-conditional-in-test
      const docsCount = Math.random() > 0.5 ? 3 : Math.random() > 0.5 ? 2 : 1
      for (let i = 0; i < docsCount; i++) {
        await payload.create({ collection: 'posts', data: { title: randomUUID(), category } })
      }
    }

    const resultDepth0 = await payload.findDistinct({
      collection: 'posts',
      sort: 'category.title',
      field: 'category',
    })
    expect(resultDepth0.values).toStrictEqual(categoriesIDS)
    const resultDepth1 = await payload.findDistinct({
      depth: 1,
      collection: 'posts',
      field: 'category',
      sort: 'category.title',
    })

    for (let i = 0; i < resultDepth1.values.length; i++) {
      const fromRes = resultDepth1.values[i] as any
      const id = categoriesIDS[i].category as any
      const title = categories[i]?.title
      expect(fromRes.category.title).toBe(title)
      expect(fromRes.category.id).toBe(id)
    }
  })

  describe('Compound Indexes', () => {
    beforeEach(async () => {
      await payload.delete({ collection: 'compound-indexes', where: {} })
    })

    it('top level: should throw a unique error', async () => {
      await payload.create({
        collection: 'compound-indexes',
        data: { three: randomUUID(), one: '1', two: '2' },
      })

      // does not fail
      await payload.create({
        collection: 'compound-indexes',
        data: { three: randomUUID(), one: '1', two: '3' },
      })
      // does not fail
      await payload.create({
        collection: 'compound-indexes',
        data: { three: randomUUID(), one: '-1', two: '2' },
      })

      // fails
      await expect(
        payload.create({
          collection: 'compound-indexes',
          data: { three: randomUUID(), one: '1', two: '2' },
        }),
      ).rejects.toBeTruthy()
    })

    it('combine group and top level: should throw a unique error', async () => {
      await payload.create({
        collection: 'compound-indexes',
        data: {
          one: randomUUID(),
          three: '3',
          group: { four: '4' },
        },
      })

      // does not fail
      await payload.create({
        collection: 'compound-indexes',
        data: { one: randomUUID(), three: '3', group: { four: '5' } },
      })
      // does not fail
      await payload.create({
        collection: 'compound-indexes',
        data: { one: randomUUID(), three: '4', group: { four: '4' } },
      })

      // fails
      await expect(
        payload.create({
          collection: 'compound-indexes',
          data: { one: randomUUID(), three: '3', group: { four: '4' } },
        }),
      ).rejects.toBeTruthy()
    })
  })

  describe('migrations', () => {
    let ranFreshTest = false

    beforeEach(async () => {
      if (
        process.env.PAYLOAD_DROP_DATABASE === 'true' &&
        'drizzle' in payload.db &&
        !ranFreshTest
      ) {
        const db = payload.db as unknown as PostgresAdapter
        await db.dropDatabase({ adapter: db })
      }
      removeFiles(path.join(dirname, './migrations'))

      await payload.db.createMigration({
        forceAcceptWarning: true,
        migrationName: 'test',
        payload,
      })
    })

    it('should run migrate:create', () => {
      // read files names in migrationsDir
      const migrationFile = path.normalize(fs.readdirSync(payload.db.migrationDir)[0])
      expect(migrationFile).toContain('_test')
    })

    it('should create index.ts file in the migrations directory with file imports', () => {
      const indexFile = path.join(payload.db.migrationDir, 'index.ts')
      const indexFileContent = fs.readFileSync(indexFile, 'utf8')
      expect(indexFileContent).toContain("_test from './")
    })

    it('should run migrate', async () => {
      let error
      try {
        await payload.db.migrate()
      } catch (e) {
        console.error(e)
        error = e
      }
      const { docs } = await payload.find({
        collection: 'payload-migrations',
      })
      const migration = docs[0]
      expect(error).toBeUndefined()
      expect(migration?.name).toContain('_test')
      expect(migration?.batch).toStrictEqual(1)
    })

    it('should run migrate:status', async () => {
      let error
      try {
        await payload.db.migrateStatus()
      } catch (e) {
        error = e
      }
      expect(error).toBeUndefined()
    })

    it('should run migrate:fresh', async () => {
      await payload.db.migrateFresh({ forceAcceptWarning: true })
      const { docs } = await payload.find({
        collection: 'payload-migrations',
      })
      const migration = docs[0]
      expect(migration.name).toContain('_test')
      expect(migration.batch).toStrictEqual(1)
      ranFreshTest = true
    })

    it('should run migrate:down', async () => {
      // known drizzle issue: https://github.com/payloadcms/payload/issues/4597
      // eslint-disable-next-line jest/no-conditional-in-test
      if (!isMongoose(payload)) {
        return
      }

      // migrate existing if there any
      await payload.db.migrate()

      await payload.db.createMigration({
        forceAcceptWarning: true,
        migrationName: 'migration_to_down',
        payload,
      })

      // migrate current to test
      await payload.db.migrate()

      const { docs } = await payload.find({ collection: 'payload-migrations' })
      expect(docs.some((doc) => doc.name.includes('migration_to_down'))).toBeTruthy()

      let error
      try {
        await payload.db.migrateDown()
      } catch (e) {
        error = e
      }

      const migrations = await payload.find({
        collection: 'payload-migrations',
      })

      expect(error).toBeUndefined()
      expect(migrations.docs.some((doc) => doc.name.includes('migration_to_down'))).toBeFalsy()

      await payload.delete({ collection: 'payload-migrations', where: {} })
    })

    it('should run migrate:refresh', async () => {
      // known drizzle issue: https://github.com/payloadcms/payload/issues/4597
      // eslint-disable-next-line jest/no-conditional-in-test
      if (!isMongoose(payload)) {
        return
      }
      let error
      try {
        await payload.db.migrateRefresh()
      } catch (e) {
        error = e
      }

      const migrations = await payload.find({
        collection: 'payload-migrations',
      })

      expect(error).toBeUndefined()
      expect(migrations.docs).toHaveLength(1)
    })
  })

  it('should run migrate:reset', async () => {
    // known drizzle issue: https://github.com/payloadcms/payload/issues/4597
    // eslint-disable-next-line jest/no-conditional-in-test
    if (!isMongoose(payload)) {
      return
    }
    let error
    try {
      await payload.db.migrateReset()
    } catch (e) {
      error = e
    }

    const migrations = await payload.find({
      collection: 'payload-migrations',
    })

    expect(error).toBeUndefined()
    expect(migrations.docs).toHaveLength(0)
  })

  describe('predefined migrations', () => {
    it('mongoose - should execute migrateVersionsV1_V2', async () => {
      // eslint-disable-next-line jest/no-conditional-in-test
      if (payload.db.name !== 'mongoose') {
        return
      }

      const req = { payload } as PayloadRequest

      let hasErr = false

      await initTransaction(req)
      await migrateVersionsV1_V2({ req }).catch(async (err) => {
        payload.logger.error(err)
        hasErr = true
        await killTransaction(req)
      })
      await commitTransaction(req)

      expect(hasErr).toBeFalsy()
    })

    it('mongoose - should execute migrateRelationshipsV2_V3', async () => {
      // eslint-disable-next-line jest/no-conditional-in-test
      if (payload.db.name !== 'mongoose') {
        return
      }

      const req = { payload } as PayloadRequest

      let hasErr = false

      const docs_before = Array.from({ length: 174 }, () => ({
        relationship: new Types.ObjectId().toHexString(),
        relationship_2: {
          relationTo: 'default-values',
          value: new Types.ObjectId().toHexString(),
        },
      }))

      const inserted = await payload.db.collections['relationships-migration'].insertMany(
        docs_before,
        {
          lean: true,
        },
      )

      const versions_before = await payload.db.versions['relationships-migration'].insertMany(
        docs_before.map((doc, i) => ({
          version: doc,
          parent: inserted[i]._id.toHexString(),
        })),
        {
          lean: true,
        },
      )

      expect(inserted.every((doc) => typeof doc.relationship === 'string')).toBeTruthy()

      await initTransaction(req)
      await migrateRelationshipsV2_V3({ req, batchSize: 66 }).catch(async (err) => {
        await killTransaction(req)
        payload.logger.error(err)
        hasErr = true
      })
      await commitTransaction(req)

      expect(hasErr).toBeFalsy()

      const docs = await payload.db.collections['relationships-migration'].find(
        {},
        {},
        { lean: true },
      )

      docs.forEach((doc, i) => {
        expect(doc.relationship).toBeInstanceOf(Types.ObjectId)
        expect(doc.relationship.toHexString()).toBe(docs_before[i].relationship)

        expect(doc.relationship_2.value).toBeInstanceOf(Types.ObjectId)
        expect(doc.relationship_2.value.toHexString()).toBe(docs_before[i].relationship_2.value)
      })

      const versions = await payload.db.versions['relationships-migration'].find(
        {},
        {},
        { lean: true },
      )

      versions.forEach((doc, i) => {
        expect(doc.parent).toBeInstanceOf(Types.ObjectId)
        expect(doc.parent.toHexString()).toBe(versions_before[i].parent)

        expect(doc.version.relationship).toBeInstanceOf(Types.ObjectId)
        expect(doc.version.relationship.toHexString()).toBe(versions_before[i].version.relationship)

        expect(doc.version.relationship_2.value).toBeInstanceOf(Types.ObjectId)
        expect(doc.version.relationship_2.value.toHexString()).toBe(
          versions_before[i].version.relationship_2.value,
        )
      })

      await payload.db.collections['relationships-migration'].deleteMany({})
      await payload.db.versions['relationships-migration'].deleteMany({})
    })
  })

  describe('schema', () => {
    it('should use custom dbNames', () => {
      expect(payload.db).toBeDefined()

      if (payload.db.name === 'mongoose') {
        // @ts-expect-error
        const db: MongooseAdapter = payload.db

        expect(db.collections['custom-schema'].modelName).toStrictEqual('customs')
        expect(db.versions['custom-schema'].modelName).toStrictEqual('_customs_versions')
        expect(db.versions.global.modelName).toStrictEqual('_customGlobal_versions')
      } else {
        // @ts-expect-error
        const db: PostgresAdapter = payload.db

        // collection
        expect(db.tables.customs).toBeDefined()

        // collection versions
        expect(db.tables._customs_v).toBeDefined()

        // collection relationships
        expect(db.tables.customs_rels).toBeDefined()

        // collection localized
        expect(db.tables.customs_locales).toBeDefined()

        // global
        expect(db.tables.customGlobal).toBeDefined()
        expect(db.tables._customGlobal_v).toBeDefined()

        // select
        expect(db.tables.customs_customSelect).toBeDefined()

        // array
        expect(db.tables.customArrays).toBeDefined()

        // array localized
        expect(db.tables.customArrays_locales).toBeDefined()

        // blocks
        expect(db.tables.customBlocks).toBeDefined()

        // localized blocks
        expect(db.tables.customBlocks_locales).toBeDefined()

        // enum names
        if (db.enums) {
          expect(db.enums.selectEnum).toBeDefined()
          expect(db.enums.radioEnum).toBeDefined()
        }
      }
    })

    it('should create and read doc with custom db names', async () => {
      const relationA = await payload.create({
        collection: 'relation-a',
        data: {
          title: 'hello',
        },
      })

      const { id } = await payload.create({
        collection: 'custom-schema',
        data: {
          array: [
            {
              localizedText: 'goodbye',
              text: 'hello',
            },
          ],
          blocks: [
            {
              blockType: 'block-second',
              localizedText: 'goodbye',
              text: 'hello',
            },
          ],
          localizedText: 'hello',
          radio: 'a',
          relationship: [relationA.id],
          select: ['a', 'b'],
          text: 'test',
        },
      })

      const doc = await payload.findByID({
        id,
        collection: 'custom-schema',
      })

      expect(doc.relationship[0].title).toStrictEqual(relationA.title)
      expect(doc.text).toStrictEqual('test')
      expect(doc.localizedText).toStrictEqual('hello')
      expect(doc.select).toHaveLength(2)
      expect(doc.radio).toStrictEqual('a')
      expect(doc.array[0].text).toStrictEqual('hello')
      expect(doc.array[0].localizedText).toStrictEqual('goodbye')
      expect(doc.blocks[0].text).toStrictEqual('hello')
      expect(doc.blocks[0].localizedText).toStrictEqual('goodbye')
    })

    it('arrays should work with both long field names and dbName', async () => {
      const { id } = await payload.create({
        collection: 'aliases',
        data: {
          thisIsALongFieldNameThatCanCauseAPostgresErrorEvenThoughWeSetAShorterDBName: [
            {
              nestedArray: [{ text: 'some-text' }],
            },
          ],
        },
      })
      const res = await payload.findByID({ collection: 'aliases', id })
      expect(
        res.thisIsALongFieldNameThatCanCauseAPostgresErrorEvenThoughWeSetAShorterDBName,
      ).toHaveLength(1)
      const item =
        res.thisIsALongFieldNameThatCanCauseAPostgresErrorEvenThoughWeSetAShorterDBName?.[0]
      assert(item)
      expect(item.nestedArray).toHaveLength(1)
      expect(item.nestedArray?.[0]?.text).toBe('some-text')
    })
  })

  describe('transactions', () => {
    describe('local api', () => {
      // sqlite cannot handle concurrent write transactions
      if (!['sqlite', 'sqlite-uuid'].includes(process.env.PAYLOAD_DATABASE)) {
        it('should commit multiple operations in isolation', async () => {
          const req = {
            payload,
            user,
          } as unknown as PayloadRequest

          await initTransaction(req)

          const first = await payload.create({
            collection,
            data: {
              title,
            },
            req,
          })

          await expect(() =>
            payload.findByID({
              id: first.id,
              collection,
              // omitting req for isolation
            }),
          ).rejects.toThrow('Not Found')

          const second = await payload.create({
            collection,
            data: {
              title,
            },
            req,
          })

          await commitTransaction(req)
          expect(req.transactionID).toBeUndefined()

          const firstResult = await payload.findByID({
            id: first.id,
            collection,
            req,
          })
          const secondResult = await payload.findByID({
            id: second.id,
            collection,
            req,
          })

          expect(firstResult.id).toStrictEqual(first.id)
          expect(secondResult.id).toStrictEqual(second.id)
        })

        it('should commit multiple operations async', async () => {
          const req = {
            payload,
            user,
          } as unknown as PayloadRequest

          let first
          let second

          const firstReq = payload
            .create({
              collection,
              data: {
                title,
              },
              req: isolateObjectProperty(req, 'transactionID'),
            })
            .then((res) => {
              first = res
            })

          const secondReq = payload
            .create({
              collection,
              data: {
                title,
              },
              req: isolateObjectProperty(req, 'transactionID'),
            })
            .then((res) => {
              second = res
            })

          await Promise.all([firstReq, secondReq])

          expect(req.transactionID).toBeUndefined()

          const firstResult = await payload.findByID({
            id: first.id,
            collection,
          })
          const secondResult = await payload.findByID({
            id: second.id,
            collection,
          })

          expect(firstResult.id).toStrictEqual(first.id)
          expect(secondResult.id).toStrictEqual(second.id)
        })

        it('should rollback operations on failure', async () => {
          const req = {
            payload,
            user,
          } as unknown as PayloadRequest

          await initTransaction(req)

          const first = await payload.create({
            collection,
            data: {
              title,
            },
            req,
          })

          try {
            await payload.create({
              collection,
              data: {
                throwAfterChange: true,
                title,
              },
              req,
            })
          } catch (error: unknown) {
            // catch error and carry on
          }

          expect(req.transactionID).toBeFalsy()

          // this should not do anything but is needed to be certain about the next assertion
          await commitTransaction(req)

          await expect(() =>
            payload.findByID({
              id: first.id,
              collection,
              req,
            }),
          ).rejects.toThrow('Not Found')
        })
      }

      describe('disableTransaction', () => {
        let disabledTransactionPost
        beforeAll(async () => {
          disabledTransactionPost = await payload.create({
            collection,
            data: {
              title,
            },
            depth: 0,
            disableTransaction: true,
          })
        })
        it('should not use transaction calling create() with disableTransaction', () => {
          expect(disabledTransactionPost.hasTransaction).toBeFalsy()
        })
        it('should not use transaction calling update() with disableTransaction', async () => {
          const result = await payload.update({
            collection,
            id: disabledTransactionPost.id,
            data: {
              title,
            },
            disableTransaction: true,
          })

          expect(result.hasTransaction).toBeFalsy()
        })
        it('should not use transaction calling delete() with disableTransaction', async () => {
          const result = await payload.delete({
            collection,
            id: disabledTransactionPost.id,
            data: {
              title,
            },
            disableTransaction: true,
          })

          expect(result.hasTransaction).toBeFalsy()
        })
      })
    })
  })

  describe('local API', () => {
    it('should support `limit` arg in bulk updates', async () => {
      for (let i = 0; i < 10; i++) {
        await payload.create({
          collection,
          data: {
            title: 'hello',
          },
        })
      }

      const updateResult = await payload.update({
        collection,
        data: {
          title: 'world',
        },
        where: {
          title: { equals: 'hello' },
        },
        limit: 5,
      })

      const findResult = await payload.find({
        collection,
        where: {
          title: { exists: true },
        },
      })

      const helloDocs = findResult.docs.filter((doc) => doc.title === 'hello')
      const worldDocs = findResult.docs.filter((doc) => doc.title === 'world')

      expect(updateResult.docs).toHaveLength(5)
      expect(updateResult.docs[0].title).toStrictEqual('world')
      expect(helloDocs).toHaveLength(5)
      expect(worldDocs).toHaveLength(5)
    })

    it('should CRUD point field', async () => {
      const result = await payload.create({
        collection: 'default-values',
        data: {
          point: [5, 10],
        },
      })

      expect(result.point).toEqual([5, 10])
    })

    it('ensure updateMany updates all docs and respects where query', async () => {
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {
          id: {
            exists: true,
          },
        },
      })

      await payload.create({
        collection: postsSlug,
        data: {
          title: 'notupdated',
        },
      })

      // Create 5 posts
      for (let i = 0; i < 5; i++) {
        await payload.create({
          collection: postsSlug,
          data: {
            title: `v1 ${i}`,
          },
        })
      }

      const result = await payload.db.updateMany({
        collection: postsSlug,
        data: {
          title: 'updated',
        },
        where: {
          title: {
            not_equals: 'notupdated',
          },
        },
      })

      expect(result?.length).toBe(5)
      expect(result?.[0]?.title).toBe('updated')
      expect(result?.[4]?.title).toBe('updated')

      // Ensure all posts minus the one we don't want updated are updated
      const { docs } = await payload.find({
        collection: postsSlug,
        depth: 0,
        pagination: false,
        where: {
          title: {
            equals: 'updated',
          },
        },
      })

      expect(docs).toHaveLength(5)
      expect(docs?.[0]?.title).toBe('updated')
      expect(docs?.[4]?.title).toBe('updated')

      const { docs: notUpdatedDocs } = await payload.find({
        collection: postsSlug,
        depth: 0,
        pagination: false,
        where: {
          title: {
            not_equals: 'updated',
          },
        },
      })

      expect(notUpdatedDocs).toHaveLength(1)
      expect(notUpdatedDocs?.[0]?.title).toBe('notupdated')
    })

    it('ensure updateMany respects limit', async () => {
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {
          id: {
            exists: true,
          },
        },
      })

      // Create 11 posts
      for (let i = 0; i < 11; i++) {
        await payload.create({
          collection: postsSlug,
          data: {
            title: 'not updated',
          },
        })
      }

      const result = await payload.db.updateMany({
        collection: postsSlug,
        data: {
          title: 'updated',
        },
        limit: 5,
        where: {
          id: {
            exists: true,
          },
        },
      })

      expect(result?.length).toBe(5)
      expect(result?.[0]?.title).toBe('updated')
      expect(result?.[4]?.title).toBe('updated')

      // Ensure all posts minus the one we don't want updated are updated
      const { docs } = await payload.find({
        collection: postsSlug,
        depth: 0,
        pagination: false,
        where: {
          title: {
            equals: 'updated',
          },
        },
      })

      expect(docs).toHaveLength(5)
      expect(docs?.[0]?.title).toBe('updated')
      expect(docs?.[4]?.title).toBe('updated')

      const { docs: notUpdatedDocs } = await payload.find({
        collection: postsSlug,
        depth: 0,
        pagination: false,
        where: {
          title: {
            equals: 'not updated',
          },
        },
      })

      expect(notUpdatedDocs).toHaveLength(6)
      expect(notUpdatedDocs?.[0]?.title).toBe('not updated')
      expect(notUpdatedDocs?.[5]?.title).toBe('not updated')
    })

    it('ensure updateMany respects limit and sort', async () => {
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {
          id: {
            exists: true,
          },
        },
      })

      const numbers = Array.from({ length: 11 }, (_, i) => i)

      // shuffle the numbers
      numbers.sort(() => Math.random() - 0.5)

      // create 11 documents numbered 0-10, but in random order
      for (const i of numbers) {
        await payload.create({
          collection: postsSlug,
          data: {
            title: 'not updated',
            number: i,
          },
        })
      }

      const result = await payload.db.updateMany({
        collection: postsSlug,
        data: {
          title: 'updated',
        },
        limit: 5,
        sort: 'number',
        where: {
          id: {
            exists: true,
          },
        },
      })

      expect(result?.length).toBe(5)

      for (let i = 0; i < 5; i++) {
        expect(result?.[i]?.number).toBe(i)
        expect(result?.[i]?.title).toBe('updated')
      }

      // Ensure all posts minus the one we don't want updated are updated
      const { docs } = await payload.find({
        collection: postsSlug,
        depth: 0,
        pagination: false,
        sort: 'number',
        where: {
          title: {
            equals: 'updated',
          },
        },
      })

      expect(docs).toHaveLength(5)
      for (let i = 0; i < 5; i++) {
        expect(docs?.[i]?.number).toBe(i)
        expect(docs?.[i]?.title).toBe('updated')
      }
    })

    it('ensure payload.update operation respects limit and sort', async () => {
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {
          id: {
            exists: true,
          },
        },
      })

      const numbers = Array.from({ length: 11 }, (_, i) => i)

      // shuffle the numbers
      numbers.sort(() => Math.random() - 0.5)

      // create 11 documents numbered 0-10, but in random order
      for (const i of numbers) {
        await payload.create({
          collection: postsSlug,
          data: {
            title: 'not updated',
            number: i,
          },
        })
      }

      const result = await payload.update({
        collection: postsSlug,
        data: {
          title: 'updated',
        },
        limit: 5,
        sort: 'number',
        where: {
          id: {
            exists: true,
          },
        },
      })

      expect(result?.docs.length).toBe(5)

      for (let i = 0; i < 5; i++) {
        expect(result?.docs?.[i]?.number).toBe(i)
        expect(result?.docs?.[i]?.title).toBe('updated')
      }

      // Ensure all posts minus the one we don't want updated are updated
      const { docs } = await payload.find({
        collection: postsSlug,
        depth: 0,
        pagination: false,
        sort: 'number',
        where: {
          title: {
            equals: 'updated',
          },
        },
      })

      expect(docs).toHaveLength(5)
      for (let i = 0; i < 5; i++) {
        expect(docs?.[i]?.number).toBe(i)
        expect(docs?.[i]?.title).toBe('updated')
      }
    })

    it('ensure updateMany respects limit and negative sort', async () => {
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {
          id: {
            exists: true,
          },
        },
      })

      const numbers = Array.from({ length: 11 }, (_, i) => i)

      // shuffle the numbers
      numbers.sort(() => Math.random() - 0.5)

      // create 11 documents numbered 0-10, but in random order
      for (const i of numbers) {
        await payload.create({
          collection: postsSlug,
          data: {
            title: 'not updated',
            number: i,
          },
        })
      }

      const result = await payload.db.updateMany({
        collection: postsSlug,
        data: {
          title: 'updated',
        },
        limit: 5,
        sort: '-number',
        where: {
          id: {
            exists: true,
          },
        },
      })

      expect(result?.length).toBe(5)

      for (let i = 10; i > 5; i--) {
        expect(result?.[-i + 10]?.number).toBe(i)
        expect(result?.[-i + 10]?.title).toBe('updated')
      }

      // Ensure all posts minus the one we don't want updated are updated
      const { docs } = await payload.find({
        collection: postsSlug,
        depth: 0,
        pagination: false,
        sort: '-number',
        where: {
          title: {
            equals: 'updated',
          },
        },
      })

      expect(docs).toHaveLength(5)
      for (let i = 10; i > 5; i--) {
        expect(docs?.[-i + 10]?.number).toBe(i)
        expect(docs?.[-i + 10]?.title).toBe('updated')
      }
    })

    it('ensure payload.update operation respects limit and negative sort', async () => {
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {
          id: {
            exists: true,
          },
        },
      })

      const numbers = Array.from({ length: 11 }, (_, i) => i)

      // shuffle the numbers
      numbers.sort(() => Math.random() - 0.5)

      // create 11 documents numbered 0-10, but in random order
      for (const i of numbers) {
        await payload.create({
          collection: postsSlug,
          data: {
            title: 'not updated',
            number: i,
          },
        })
      }

      const result = await payload.update({
        collection: postsSlug,
        data: {
          title: 'updated',
        },
        limit: 5,
        sort: '-number',
        where: {
          id: {
            exists: true,
          },
        },
      })

      expect(result?.docs?.length).toBe(5)

      for (let i = 10; i > 5; i--) {
        expect(result?.docs?.[-i + 10]?.number).toBe(i)
        expect(result?.docs?.[-i + 10]?.title).toBe('updated')
      }

      // Ensure all posts minus the one we don't want updated are updated
      const { docs } = await payload.find({
        collection: postsSlug,
        depth: 0,
        pagination: false,
        sort: '-number',
        where: {
          title: {
            equals: 'updated',
          },
        },
      })

      expect(docs).toHaveLength(5)
      for (let i = 10; i > 5; i--) {
        expect(docs?.[-i + 10]?.number).toBe(i)
        expect(docs?.[-i + 10]?.title).toBe('updated')
      }
    })

    it('ensure updateMany correctly handles 0 limit', async () => {
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {
          id: {
            exists: true,
          },
        },
      })

      // Create 5 posts
      for (let i = 0; i < 5; i++) {
        await payload.create({
          collection: postsSlug,
          data: {
            title: 'not updated',
          },
        })
      }

      const result = await payload.db.updateMany({
        collection: postsSlug,
        data: {
          title: 'updated',
        },
        limit: 0,
        where: {
          id: {
            exists: true,
          },
        },
      })

      expect(result?.length).toBe(5)
      expect(result?.[0]?.title).toBe('updated')
      expect(result?.[4]?.title).toBe('updated')

      // Ensure all posts are updated. limit: 0 should mean unlimited
      const { docs } = await payload.find({
        collection: postsSlug,
        depth: 0,
        pagination: false,
        where: {
          title: {
            equals: 'updated',
          },
        },
      })

      expect(docs).toHaveLength(5)
      expect(docs?.[0]?.title).toBe('updated')
      expect(docs?.[4]?.title).toBe('updated')
    })

    it('ensure updateMany correctly handles -1 limit', async () => {
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {
          id: {
            exists: true,
          },
        },
      })

      // Create 5 posts
      for (let i = 0; i < 5; i++) {
        await payload.create({
          collection: postsSlug,
          data: {
            title: 'not updated',
          },
        })
      }

      const result = await payload.db.updateMany({
        collection: postsSlug,
        data: {
          title: 'updated',
        },
        limit: -1,
        where: {
          id: {
            exists: true,
          },
        },
      })

      expect(result?.length).toBe(5)
      expect(result?.[0]?.title).toBe('updated')
      expect(result?.[4]?.title).toBe('updated')

      // Ensure all posts are updated. limit: -1 should mean unlimited
      const { docs } = await payload.find({
        collection: postsSlug,
        depth: 0,
        pagination: false,
        where: {
          title: {
            equals: 'updated',
          },
        },
      })

      expect(docs).toHaveLength(5)
      expect(docs?.[0]?.title).toBe('updated')
      expect(docs?.[4]?.title).toBe('updated')
    })

    it('ensure updateOne does not create new document if `where` query has no results', async () => {
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {
          id: {
            exists: true,
          },
        },
      })

      await payload.db.updateOne({
        collection: postsSlug,
        data: {
          title: 'updated',
        },
        where: {
          title: {
            equals: 'does not exist',
          },
        },
      })

      const allPosts = await payload.db.find({
        collection: postsSlug,
        pagination: false,
      })

      expect(allPosts.docs).toHaveLength(0)
    })

    it('ensure updateMany does not create new document if `where` query has no results', async () => {
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {
          id: {
            exists: true,
          },
        },
      })

      await payload.db.updateMany({
        collection: postsSlug,
        data: {
          title: 'updated',
        },
        where: {
          title: {
            equals: 'does not exist',
          },
        },
      })

      const allPosts = await payload.db.find({
        collection: postsSlug,
        pagination: false,
      })

      expect(allPosts.docs).toHaveLength(0)
    })
  })

  describe('Error Handler', () => {
    it('should return proper top-level field validation errors', async () => {
      let errorMessage: string = ''

      try {
        await payload.create({
          collection: postsSlug,
          data: {
            // @ts-expect-error
            title: undefined,
          },
        })
      } catch (e: any) {
        errorMessage = e.message
      }

      expect(errorMessage).toBe('The following field is invalid: Title')
    })

    it('should return validation errors in response', async () => {
      try {
        await payload.create({
          collection: postsSlug,
          data: {
            title: 'Title',
            D1: {
              D2: {
                D3: {
                  // @ts-expect-error
                  D4: {},
                },
              },
            },
          },
        })
      } catch (e: any) {
        expect(e.message).toMatch(
          payload.db.name === 'mongoose'
            ? 'posts validation failed: D1.D2.D3.D4: Cast to string failed for value "{}" (type Object) at path "D4"'
            : payload.db.name === 'sqlite'
              ? 'SQLite3 can only bind numbers, strings, bigints, buffers, and null'
              : '',
        )
      }
    })

    it('should return validation errors with proper field paths for unnamed fields', async () => {
      try {
        await payload.create({
          collection: errorOnUnnamedFieldsSlug,
          data: {
            groupWithinUnnamedTab: {
              // @ts-expect-error
              text: undefined,
            },
          },
        })
      } catch (e: any) {
        expect(e.data?.errors?.[0]?.path).toBe('groupWithinUnnamedTab.text')
      }
    })
  })

  describe('defaultValue', () => {
    it('should set default value from db.create', async () => {
      // call the db adapter create directly to bypass Payload's default value assignment
      const result = await payload.db.create({
        collection: 'default-values',
        data: {
          // for drizzle DBs, we need to pass an array of objects to test subfields
          array: [{ id: 1 }],
          title: 'hello',
        },
        req: undefined,
      })

      expect(result.defaultValue).toStrictEqual('default value from database')
      expect(result.array[0].defaultValue).toStrictEqual('default value from database')
      expect(result.group.defaultValue).toStrictEqual('default value from database')
      expect(result.select).toStrictEqual('default')
      expect(result.point).toStrictEqual({ coordinates: [10, 20], type: 'Point' })
      expect(result.escape).toStrictEqual("Thanks, we're excited for you to join us.")
    })
  })

  describe('Schema generation', () => {
    if (process.env.PAYLOAD_DATABASE.includes('postgres')) {
      it('should generate Drizzle Postgres schema', async () => {
        const generatedAdapterName = process.env.PAYLOAD_DATABASE

        const outputFile = path.resolve(dirname, `${generatedAdapterName}.generated-schema.ts`)

        await payload.db.generateSchema({
          outputFile,
        })

        const module = await import(outputFile)

        // Confirm that the generated module exports every relation
        for (const relation in payload.db.relations) {
          expect(module).toHaveProperty(relation)
        }

        // Confirm that module exports every table
        for (const table in payload.db.tables) {
          expect(module).toHaveProperty(table)
        }

        // Confirm that module exports every enum
        for (const enumName in payload.db.enums) {
          expect(module).toHaveProperty(enumName)
        }
      })
    }

    if (process.env.PAYLOAD_DATABASE.includes('sqlite')) {
      it('should generate Drizzle SQLite schema', async () => {
        const generatedAdapterName = process.env.PAYLOAD_DATABASE

        const outputFile = path.resolve(dirname, `${generatedAdapterName}.generated-schema.ts`)

        await payload.db.generateSchema({
          outputFile,
        })

        const module = await import(outputFile)

        // Confirm that the generated module exports every relation
        for (const relation in payload.db.relations) {
          expect(module).toHaveProperty(relation)
        }

        // Confirm that module exports every table
        for (const table in payload.db.tables) {
          expect(module).toHaveProperty(table)
        }
      })
    }
  })

  describe('drizzle: schema hooks', () => {
    beforeAll(() => {
      process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = 'true'
    })

    // TODO: this test is currently not working, come back to fix in a separate PR, issue: 12907
    it.skip('should add tables with hooks', async () => {
      // eslint-disable-next-line jest/no-conditional-in-test
      if (payload.db.name === 'mongoose') {
        return
      }

      let added_table_before: Table
      let added_table_after: Table

      // eslint-disable-next-line jest/no-conditional-in-test
      if (payload.db.name.includes('postgres')) {
        // eslint-disable-next-line jest/no-conditional-in-test
        const t = (payload.db.pgSchema?.table ?? drizzlePg.pgTable) as typeof drizzlePg.pgTable
        added_table_before = t('added_table_before', {
          id: drizzlePg.serial('id').primaryKey(),
          text: drizzlePg.text('text'),
        })

        added_table_after = t('added_table_after', {
          id: drizzlePg.serial('id').primaryKey(),
          text: drizzlePg.text('text'),
        })
      }

      // eslint-disable-next-line jest/no-conditional-in-test
      if (payload.db.name.includes('sqlite')) {
        added_table_before = drizzleSqlite.sqliteTable('added_table_before', {
          id: drizzleSqlite.integer('id').primaryKey(),
          text: drizzleSqlite.text('text'),
        })

        added_table_after = drizzleSqlite.sqliteTable('added_table_after', {
          id: drizzleSqlite.integer('id').primaryKey(),
          text: drizzleSqlite.text('text'),
        })
      }

      payload.db.beforeSchemaInit = [
        ({ schema }) => ({
          ...schema,
          tables: {
            ...schema.tables,
            added_table_before,
          },
        }),
      ]

      payload.db.afterSchemaInit = [
        ({ schema }) => {
          return {
            ...schema,
            tables: {
              ...schema.tables,
              added_table_after,
            },
          }
        },
      ]

      delete payload.db.pool
      await payload.db.init()

      expect(payload.db.tables.added_table_before).toBeDefined()

      await payload.db.connect()

      await payload.db.execute({
        drizzle: payload.db.drizzle,
        raw: `INSERT into added_table_before (text) VALUES ('some-text')`,
      })

      const res_before = await payload.db.execute({
        drizzle: payload.db.drizzle,
        raw: 'SELECT * from added_table_before',
      })
      expect(res_before.rows[0].text).toBe('some-text')

      await payload.db.execute({
        drizzle: payload.db.drizzle,
        raw: `INSERT into added_table_after (text) VALUES ('some-text')`,
      })

      const res_after = await payload.db.execute({
        drizzle: payload.db.drizzle,
        raw: `SELECT * from added_table_after`,
      })

      expect(res_after.rows[0].text).toBe('some-text')
    })

    it('should extend the existing table with extra column and modify the existing column with enforcing DB level length', async () => {
      // eslint-disable-next-line jest/no-conditional-in-test
      if (payload.db.name === 'mongoose') {
        return
      }

      const isSQLite = payload.db.name === 'sqlite'

      payload.db.afterSchemaInit = [
        ({ schema, extendTable }) => {
          extendTable({
            table: schema.tables.places,
            columns: {
              // SQLite doesn't have DB length enforcement
              // eslint-disable-next-line jest/no-conditional-in-test
              ...(payload.db.name === 'postgres' && {
                city: drizzlePg.varchar('city', { length: 10 }),
              }),
              // eslint-disable-next-line jest/no-conditional-in-test
              extraColumn: isSQLite
                ? drizzleSqlite.integer('extra_column')
                : drizzlePg.integer('extra_column'),
            },
          })

          return schema
        },
      ]

      delete payload.db.pool
      await payload.db.init()
      await payload.db.connect()

      expect(payload.db.tables.places.extraColumn).toBeDefined()

      await payload.create({
        collection: 'places',
        data: {
          city: 'Berlin',
          country: 'Germany',
        },
      })

      // eslint-disable-next-line jest/no-conditional-in-test
      const tableName = payload.db.schemaName ? `"${payload.db.schemaName}"."places"` : 'places'

      await payload.db.execute({
        drizzle: payload.db.drizzle,
        raw: `UPDATE ${tableName} SET extra_column = 10`,
      })

      const res_with_extra_col = await payload.db.execute({
        drizzle: payload.db.drizzle,
        raw: `SELECT * from ${tableName}`,
      })

      expect(res_with_extra_col.rows[0].extra_column).toBe(10)

      // SQLite doesn't have DB length enforcement
      // eslint-disable-next-line jest/no-conditional-in-test
      if (payload.db.name === 'postgres') {
        await expect(
          payload.db.execute({
            drizzle: payload.db.drizzle,
            raw: `UPDATE ${tableName} SET city = 'MoreThan10Chars'`,
          }),
        ).rejects.toBeTruthy()
      }
    })

    it('should extend the existing table with composite unique and throw ValidationError on it', async () => {
      // eslint-disable-next-line jest/no-conditional-in-test
      if (payload.db.name === 'mongoose') {
        return
      }

      const isSQLite = payload.db.name === 'sqlite'

      payload.db.afterSchemaInit = [
        ({ schema, extendTable }) => {
          extendTable({
            table: schema.tables.places,
            extraConfig: (t) => ({
              // eslint-disable-next-line jest/no-conditional-in-test
              uniqueOnCityAndCountry: (isSQLite ? drizzleSqlite : drizzlePg)
                .unique()
                .on(t.city, t.country),
            }),
          })

          return schema
        },
      ]

      delete payload.db.pool
      await payload.db.init()
      await payload.db.connect()

      await payload.create({
        collection: 'places',
        data: {
          city: 'A',
          country: 'B',
        },
      })

      await expect(
        payload.create({
          collection: 'places',
          data: {
            city: 'C',
            country: 'B',
          },
        }),
      ).resolves.toBeTruthy()

      await expect(
        payload.create({
          collection: 'places',
          data: {
            city: 'A',
            country: 'D',
          },
        }),
      ).resolves.toBeTruthy()

      await expect(
        payload.create({
          collection: 'places',
          data: {
            city: 'A',
            country: 'B',
          },
        }),
      ).rejects.toBeTruthy()
    })
  })

  describe('virtual fields', () => {
    it('should not save a field with `virtual: true` to the db', async () => {
      const createRes = await payload.create({
        collection: 'fields-persistance',
        data: { text: 'asd', array: [], textHooked: 'asd' },
      })

      const resLocal = await payload.findByID({
        collection: 'fields-persistance',
        id: createRes.id,
      })

      const resDb = (await payload.db.findOne({
        collection: 'fields-persistance',
        where: { id: { equals: createRes.id } },
        req: {} as PayloadRequest,
      })) as Record<string, unknown>

      expect(resDb.text).toBeUndefined()
      expect(resDb.array).toBeUndefined()
      expect(resDb.textHooked).toBeUndefined()

      expect(resLocal.textHooked).toBe('hooked')
    })

    it('should not save a nested field to tabs/row/collapsible with virtual: true to the db', async () => {
      const res = await payload.create({
        data: {
          textWithinCollapsible: '1',
          textWithinRow: '2',
          textWithinTabs: '3',
        },
        collection: 'fields-persistance',
      })

      expect(res.textWithinCollapsible).toBeUndefined()
      expect(res.textWithinRow).toBeUndefined()
      expect(res.textWithinTabs).toBeUndefined()
    })

    it('should allow virtual field with reference', async () => {
      const post = await payload.create({ collection: 'posts', data: { title: 'my-title' } })
      const { id } = await payload.create({
        collection: 'virtual-relations',
        depth: 0,
        data: { post: post.id },
      })

      const doc = await payload.findByID({ collection: 'virtual-relations', depth: 0, id })
      expect(doc.postTitle).toBe('my-title')
      const draft = await payload.find({
        collection: 'virtual-relations',
        depth: 0,
        where: { id: { equals: id } },
      })
      expect(draft.docs[0]?.postTitle).toBe('my-title')
    })

    it('should not break when using select', async () => {
      const post = await payload.create({ collection: 'posts', data: { title: 'my-title-10' } })
      const { id } = await payload.create({
        collection: 'virtual-relations',
        depth: 0,
        data: { post: post.id },
      })

      const doc = await payload.findByID({
        collection: 'virtual-relations',
        depth: 0,
        id,
        select: { postTitle: true },
      })
      expect(doc.postTitle).toBe('my-title-10')
    })

    it('should respect hidden: true for virtual fields with reference', async () => {
      const post = await payload.create({ collection: 'posts', data: { title: 'my-title-3' } })
      const { id } = await payload.create({
        collection: 'virtual-relations',
        depth: 0,
        data: { post: post.id },
      })

      const doc = await payload.findByID({ collection: 'virtual-relations', depth: 0, id })
      expect(doc.postTitleHidden).toBeUndefined()

      const doc_show = await payload.findByID({
        collection: 'virtual-relations',
        depth: 0,
        id,
        showHiddenFields: true,
      })
      expect(doc_show.postTitleHidden).toBe('my-title-3')
    })

    it('should allow virtual field as reference to ID', async () => {
      const post = await payload.create({ collection: 'posts', data: { title: 'my-title' } })
      const { id } = await payload.create({
        collection: 'virtual-relations',
        depth: 0,
        data: { post: post.id },
      })

      const docDepth2 = await payload.findByID({ collection: 'virtual-relations', id })
      expect(docDepth2.postID).toBe(post.id)
      const docDepth0 = await payload.findByID({ collection: 'virtual-relations', id, depth: 0 })
      expect(docDepth0.postID).toBe(post.id)
    })

    it('should allow virtual field as reference to custom ID', async () => {
      const customID = await payload.create({ collection: 'custom-ids', data: {} })
      const { id } = await payload.create({
        collection: 'virtual-relations',
        depth: 0,
        data: { customID: customID.id },
      })

      const docDepth2 = await payload.findByID({ collection: 'virtual-relations', id })
      expect(docDepth2.customIDValue).toBe(customID.id)
      const docDepth0 = await payload.findByID({
        collection: 'virtual-relations',
        id,
        depth: 0,
      })
      expect(docDepth0.customIDValue).toBe(customID.id)
    })

    it('should allow deep virtual field as reference to ID', async () => {
      const category = await payload.create({
        collection: 'categories',
        data: { title: 'category-3' },
      })
      const post = await payload.create({
        collection: 'posts',
        data: { category: category.id, title: 'my-title-3' },
      })
      const { id } = await payload.create({
        collection: 'virtual-relations',
        depth: 0,
        data: { post: post.id },
      })

      const docDepth2 = await payload.findByID({ collection: 'virtual-relations', id })
      expect(docDepth2.postCategoryID).toBe(category.id)
      const docDepth0 = await payload.findByID({ collection: 'virtual-relations', id, depth: 0 })
      expect(docDepth0.postCategoryID).toBe(category.id)
    })

    it('should allow virtual field with reference localized', async () => {
      const post = await payload.create({
        collection: 'posts',
        data: { title: 'my-title', localized: 'localized en' },
      })

      await payload.update({
        collection: 'posts',
        id: post.id,
        locale: 'es',
        data: { localized: 'localized es' },
      })

      const { id } = await payload.create({
        collection: 'virtual-relations',
        depth: 0,
        data: { post: post.id },
      })

      let doc = await payload.findByID({ collection: 'virtual-relations', depth: 0, id })
      expect(doc.postLocalized).toBe('localized en')

      doc = await payload.findByID({ collection: 'virtual-relations', depth: 0, id, locale: 'es' })
      expect(doc.postLocalized).toBe('localized es')
    })

    it('should allow to query by a virtual field with reference', async () => {
      await payload.delete({ collection: 'posts', where: {} })
      await payload.delete({ collection: 'virtual-relations', where: {} })
      const post_1 = await payload.create({ collection: 'posts', data: { title: 'Dan' } })
      const post_2 = await payload.create({ collection: 'posts', data: { title: 'Mr.Dan' } })

      const doc_1 = await payload.create({
        collection: 'virtual-relations',
        depth: 0,
        data: { post: post_1.id },
      })
      const doc_2 = await payload.create({
        collection: 'virtual-relations',
        depth: 0,
        data: { post: post_2.id },
      })

      const { docs: ascDocs } = await payload.find({
        collection: 'virtual-relations',
        sort: 'postTitle',
        depth: 0,
      })

      expect(ascDocs[0]?.id).toBe(doc_1.id)

      expect(ascDocs[1]?.id).toBe(doc_2.id)

      const { docs: descDocs } = await payload.find({
        collection: 'virtual-relations',
        sort: '-postTitle',
        depth: 0,
      })

      expect(descDocs[1]?.id).toBe(doc_1.id)

      expect(descDocs[0]?.id).toBe(doc_2.id)
    })

    it('should allow virtual field 2x deep', async () => {
      const category = await payload.create({
        collection: 'categories',
        data: { title: '1-category' },
      })
      const post = await payload.create({
        collection: 'posts',
        data: { title: '1-post', category: category.id },
      })
      const doc = await payload.create({ collection: 'virtual-relations', data: { post: post.id } })
      expect(doc.postCategoryTitle).toBe('1-category')
    })

    it('should not break when using select 2x deep', async () => {
      const category = await payload.create({
        collection: 'categories',
        data: { title: '3-category' },
      })
      const post = await payload.create({
        collection: 'posts',
        data: { title: '3-post', category: category.id },
      })
      const doc = await payload.create({ collection: 'virtual-relations', data: { post: post.id } })

      const docWithSelect = await payload.findByID({
        collection: 'virtual-relations',
        depth: 0,
        id: doc.id,
        select: { postCategoryTitle: true },
      })
      expect(docWithSelect.postCategoryTitle).toBe('3-category')
    })

    it('should allow to query by virtual field 2x deep', async () => {
      const category = await payload.create({
        collection: 'categories',
        data: { title: '2-category' },
      })
      const post = await payload.create({
        collection: 'posts',
        data: { title: '2-post', category: category.id },
      })
      const doc = await payload.create({ collection: 'virtual-relations', data: { post: post.id } })
      const found = await payload.find({
        collection: 'virtual-relations',
        where: { postCategoryTitle: { equals: '2-category' } },
      })
      expect(found.docs).toHaveLength(1)
      expect(found.docs[0].id).toBe(doc.id)
    })

    it('should allow to query by virtual field 2x deep with draft:true', async () => {
      await payload.delete({ collection: 'virtual-relations', where: {} })
      const category = await payload.create({
        collection: 'categories',
        data: { title: '3-category' },
      })
      const post = await payload.create({
        collection: 'posts',
        data: { title: '3-post', category: category.id },
      })
      const doc = await payload.create({ collection: 'virtual-relations', data: { post: post.id } })
      const found = await payload.find({
        collection: 'virtual-relations',
        where: { postCategoryTitle: { equals: '3-category' } },
        draft: true,
      })
      expect(found.docs).toHaveLength(1)
      expect(found.docs[0].id).toBe(doc.id)
    })

    it('should allow referenced virtual field in globals', async () => {
      const post = await payload.create({ collection: 'posts', data: { title: 'post' } })
      const globalData = await payload.updateGlobal({
        slug: 'virtual-relation-global',
        data: { post: post.id },
        depth: 0,
      })
      expect(globalData.postTitle).toBe('post')
    })

    it('should allow to sort by a virtual field with a reference to an ID', async () => {
      await payload.delete({ collection: 'virtual-relations', where: {} })
      const category_1 = await payload.create({
        collection: 'categories-custom-id',
        data: { id: 1 },
      })
      const category_2 = await payload.create({
        collection: 'categories-custom-id',
        data: { id: 2 },
      })
      const post_1 = await payload.create({
        collection: 'posts',
        data: { categoryCustomID: category_1.id, title: 'p-1' },
      })
      const post_2 = await payload.create({
        collection: 'posts',
        data: { categoryCustomID: category_2.id, title: 'p-2' },
      })
      const virtual_1 = await payload.create({
        collection: 'virtual-relations',
        data: { post: post_1.id },
      })
      const virtual_2 = await payload.create({
        collection: 'virtual-relations',
        data: { post: post_2.id },
      })

      const res = (
        await payload.find({
          collection: 'virtual-relations',
          sort: 'postCategoryCustomID',
        })
      ).docs
      expect(res[0].id).toBe(virtual_1.id)
      expect(res[1].id).toBe(virtual_2.id)

      const res2 = (
        await payload.find({
          collection: 'virtual-relations',
          sort: '-postCategoryCustomID',
        })
      ).docs
      expect(res2[1].id).toBe(virtual_1.id)
      expect(res2[0].id).toBe(virtual_2.id)
    })

    it('should allow to sort by a virtual field with a refence, Local / GraphQL', async () => {
      const post_1 = await payload.create({ collection: 'posts', data: { title: 'A' } })
      const post_2 = await payload.create({ collection: 'posts', data: { title: 'B' } })
      const doc_1 = await payload.create({
        collection: 'virtual-relations',
        data: { post: post_1 },
      })
      const doc_2 = await payload.create({
        collection: 'virtual-relations',
        data: { post: post_2 },
      })

      const queryDesc = `query {
        VirtualRelations(
          where: {OR: [{ id: { equals: ${JSON.stringify(doc_1.id)} } }, { id: { equals: ${JSON.stringify(doc_2.id)} } }],
        }, sort: "-postTitle") {
          docs {
            id
          }
        }
      }`

      const {
        data: {
          VirtualRelations: { docs: graphqlDesc },
        },
      } = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query: queryDesc }) })
        .then((res) => res.json())

      const { docs: localDesc } = await payload.find({
        collection: 'virtual-relations',
        sort: '-postTitle',
        where: { id: { in: [doc_1.id, doc_2.id] } },
      })

      expect(graphqlDesc[0].id).toBe(doc_2.id)
      expect(graphqlDesc[1].id).toBe(doc_1.id)
      expect(localDesc[0].id).toBe(doc_2.id)
      expect(localDesc[1].id).toBe(doc_1.id)

      const queryAsc = `query {
        VirtualRelations(
          where: {OR: [{ id: { equals: ${JSON.stringify(doc_1.id)} } }, { id: { equals: ${JSON.stringify(doc_2.id)} } }],
        }, sort: "postTitle") {
          docs {
            id
          }
        }
      }`

      const {
        data: {
          VirtualRelations: { docs: graphqlAsc },
        },
      } = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query: queryAsc }) })
        .then((res) => res.json())

      const { docs: localAsc } = await payload.find({
        collection: 'virtual-relations',
        sort: 'postTitle',
        where: { id: { in: [doc_1.id, doc_2.id] } },
      })

      expect(graphqlAsc[1].id).toBe(doc_2.id)
      expect(graphqlAsc[0].id).toBe(doc_1.id)
      expect(localAsc[1].id).toBe(doc_2.id)
      expect(localAsc[0].id).toBe(doc_1.id)
    })

    it('should allow to sort by a virtual field without error', async () => {
      await payload.delete({ collection: fieldsPersistanceSlug, where: {} })
      await payload.create({
        collection: fieldsPersistanceSlug,
        data: {},
      })
      const { docs } = await payload.find({
        collection: fieldsPersistanceSlug,
        sort: '-textHooked',
      })
      expect(docs).toHaveLength(1)
    })
  })

  it('should convert numbers to text', async () => {
    const result = await payload.create({
      collection: postsSlug,
      data: {
        title: 'testing',
        // @ts-expect-error hardcoding a number and expecting that it will convert to string
        text: 1,
      },
    })

    expect(result.text).toStrictEqual('1')
  })

  it('should not allow to query by a field with `virtual: true`', async () => {
    await expect(
      payload.find({
        collection: 'fields-persistance',
        where: { text: { equals: 'asd' } },
      }),
    ).rejects.toThrow(QueryError)
  })

  it('should not allow document creation with relationship data to an invalid document ID', async () => {
    let invalidDoc

    try {
      invalidDoc = await payload.create({
        collection: 'relation-b',
        data: { title: 'invalid', relationship: 'not-real-id' },
      })
    } catch (error) {
      // instanceof checks don't work with libsql
      expect(error).toBeTruthy()
    }

    expect(invalidDoc).toBeUndefined()

    const relationBDocs = await payload.find({
      collection: 'relation-b',
    })

    expect(relationBDocs.docs).toHaveLength(0)
  })

  it('should upsert', async () => {
    const postShouldCreated = await payload.db.upsert({
      req: {},
      collection: postsSlug,
      data: {
        title: 'some-title-here',
      },
      where: {
        title: {
          equals: 'some-title-here',
        },
      },
    })

    expect(postShouldCreated).toBeTruthy()

    const postShouldUpdated = await payload.db.upsert({
      req: {},
      collection: postsSlug,
      data: {
        title: 'some-title-here',
      },
      where: {
        title: {
          equals: 'some-title-here',
        },
      },
    })

    // Should stay the same ID
    expect(postShouldCreated.id).toBe(postShouldUpdated.id)
  })

  it('should enforce unique ids on db level even after delete', async () => {
    const { id } = await payload.create({ collection: postsSlug, data: { title: 'ASD' } })
    await payload.delete({ id, collection: postsSlug })
    const { id: id_2 } = await payload.create({ collection: postsSlug, data: { title: 'ASD' } })
    expect(id_2).not.toBe(id)
  })

  it('payload.db.createGlobal should have globalType, updatedAt, createdAt fields', async () => {
    const timestamp = Date.now()
    let result = (await payload.db.createGlobal({
      slug: 'global-2',
      data: { text: 'this is global-2' },
    })) as { globalType: string } & Global2

    expect(result.text).toBe('this is global-2')
    expect(result.globalType).toBe('global-2')
    expect(timestamp).toBeLessThanOrEqual(new Date(result.createdAt as string).getTime())
    expect(timestamp).toBeLessThanOrEqual(new Date(result.updatedAt as string).getTime())

    const createdAt = new Date(result.createdAt as string).getTime()

    result = (await payload.db.updateGlobal({
      slug: 'global-2',
      data: { text: 'this is global-2 but updated' },
    })) as { globalType: string } & Global2

    expect(result.text).toBe('this is global-2 but updated')
    expect(result.globalType).toBe('global-2')
    expect(createdAt).toEqual(new Date(result.createdAt as string).getTime())
    expect(createdAt).toBeLessThan(new Date(result.updatedAt as string).getTime())
  })

  it('payload.updateGlobal should have globalType, updatedAt, createdAt fields', async () => {
    const timestamp = Date.now()
    let result = (await payload.updateGlobal({
      slug: 'global-3',
      data: { text: 'this is global-3' },
    })) as { globalType: string } & Global2

    expect(result.text).toBe('this is global-3')
    expect(result.globalType).toBe('global-3')
    expect(timestamp).toBeLessThanOrEqual(new Date(result.createdAt as string).getTime())
    expect(timestamp).toBeLessThanOrEqual(new Date(result.updatedAt as string).getTime())

    const createdAt = new Date(result.createdAt as string).getTime()

    result = (await payload.updateGlobal({
      slug: 'global-3',
      data: { text: 'this is global-3 but updated' },
    })) as { globalType: string } & Global2

    expect(result.text).toBe('this is global-3 but updated')
    expect(result.globalType).toBe('global-3')
    expect(createdAt).toEqual(new Date(result.createdAt as string).getTime())
    expect(createdAt).toBeLessThan(new Date(result.updatedAt as string).getTime())
  })

  it('should group where conditions with AND', async () => {
    // create 2 docs
    await payload.create({
      collection: postsSlug,
      data: {
        title: 'post 1',
      },
    })

    const doc2 = await payload.create({
      collection: postsSlug,
      data: {
        title: 'post 2',
      },
    })

    const query1 = await payload.find({
      collection: postsSlug,
      where: {
        id: {
          // where order, `in` last
          not_in: [],
          in: [doc2.id],
        },
      },
    })

    const query2 = await payload.find({
      collection: postsSlug,
      where: {
        id: {
          // where order, `in` first
          in: [doc2.id],
          not_in: [],
        },
      },
    })

    const query3 = await payload.find({
      collection: postsSlug,
      where: {
        and: [
          {
            id: {
              in: [doc2.id],
              not_in: [],
            },
          },
        ],
      },
    })

    expect(query1.totalDocs).toEqual(1)
    expect(query2.totalDocs).toEqual(1)
    expect(query3.totalDocs).toEqual(1)
  })

  it('db.deleteOne should not fail if query does not resolve to any document', async () => {
    await expect(
      payload.db.deleteOne({
        collection: 'posts',
        returning: false,
        where: { title: { equals: 'some random title' } },
      }),
    ).resolves.toBeNull()
  })

  it('mongodb additional keys stripping', async () => {
    // eslint-disable-next-line jest/no-conditional-in-test
    if (payload.db.name !== 'mongoose') {
      return
    }

    const arrItemID = randomUUID()
    const res = await payload.db.collections[postsSlug]?.collection.insertOne({
      SECRET_FIELD: 'secret data',
      arrayWithIDs: [
        {
          id: arrItemID,
          additionalKeyInArray: 'true',
          text: 'existing key',
        },
      ],
    })

    let payloadRes: any = await payload.findByID({
      collection: postsSlug,
      id: res!.insertedId.toHexString(),
    })

    expect(payloadRes.id).toBe(res!.insertedId.toHexString())
    expect(payloadRes['SECRET_FIELD']).toBeUndefined()
    expect(payloadRes.arrayWithIDs).toBeDefined()
    expect(payloadRes.arrayWithIDs[0].id).toBe(arrItemID)
    expect(payloadRes.arrayWithIDs[0].text).toBe('existing key')
    expect(payloadRes.arrayWithIDs[0].additionalKeyInArray).toBeUndefined()

    // But allows when allowAdditionaKeys is true
    payload.db.allowAdditionalKeys = true

    payloadRes = await payload.findByID({
      collection: postsSlug,
      id: res!.insertedId.toHexString(),
    })

    expect(payloadRes.id).toBe(res!.insertedId.toHexString())
    expect(payloadRes['SECRET_FIELD']).toBe('secret data')
    expect(payloadRes.arrayWithIDs[0].additionalKeyInArray).toBe('true')

    payload.db.allowAdditionalKeys = false
  })

  it('should not crash when the version field is not selected', async () => {
    const customID = await payload.create({ collection: 'custom-ids', data: {} })
    const res = await payload.db.queryDrafts({
      collection: 'custom-ids',
      where: { parent: { equals: customID.id } },
      select: { parent: true },
    })

    expect(res.docs[0].id).toBe(customID.id)
  })

  it('deep nested arrays', async () => {
    await payload.updateGlobal({
      slug: 'header',
      data: { itemsLvl1: [{ itemsLvl2: [{ itemsLvl3: [{ itemsLvl4: [{ label: 'label' }] }] }] }] },
    })

    const header = await payload.findGlobal({ slug: 'header' })

    expect(header.itemsLvl1[0]?.itemsLvl2[0]?.itemsLvl3[0]?.itemsLvl4[0]?.label).toBe('label')
  })

  it('should count with a query that contains subqueries', async () => {
    const category = await payload.create({
      collection: 'categories',
      data: { title: 'new-category' },
    })
    const post = await payload.create({
      collection: 'posts',
      data: { title: 'new-post', category: category.id },
    })

    const result_1 = await payload.count({
      collection: 'posts',
      where: {
        'category.title': {
          equals: 'new-category',
        },
      },
    })

    expect(result_1.totalDocs).toBe(1)

    const result_2 = await payload.count({
      collection: 'posts',
      where: {
        'category.title': {
          equals: 'non-existing-category',
        },
      },
    })

    expect(result_2.totalDocs).toBe(0)
  })

  it('can have localized and non localized blocks', async () => {
    const res = await payload.create({
      collection: 'blocks-docs',
      data: {
        testBlocks: [{ blockType: 'cta', text: 'text' }],
        testBlocksLocalized: [{ blockType: 'cta', text: 'text-localized' }],
      },
    })

    expect(res.testBlocks[0]?.text).toBe('text')
    expect(res.testBlocksLocalized[0]?.text).toBe('text-localized')
  })

  it('should support in with null', async () => {
    await payload.delete({ collection: 'posts', where: {} })
    const post_1 = await payload.create({
      collection: 'posts',
      data: { title: 'a', text: 'text-1' },
    })
    const post_2 = await payload.create({
      collection: 'posts',
      data: { title: 'a', text: 'text-2' },
    })
    const post_3 = await payload.create({
      collection: 'posts',
      data: { title: 'a', text: 'text-3' },
    })
    const post_null = await payload.create({
      collection: 'posts',
      data: { title: 'a', text: null },
    })

    const { docs } = await payload.find({
      collection: 'posts',
      where: { text: { in: ['text-1', 'text-3', null] } },
    })
    expect(docs).toHaveLength(3)
    expect(docs[0].id).toBe(post_null.id)
    expect(docs[1].id).toBe(post_3.id)
    expect(docs[2].id).toBe(post_1.id)
  })

  it('should throw specific unique contraint errors', async () => {
    await payload.create({
      collection: 'unique-fields',
      data: {
        slugField: 'unique-text',
      },
    })

    try {
      await payload.create({
        collection: 'unique-fields',
        data: {
          slugField: 'unique-text',
        },
      })
    } catch (e) {
      expect((e as ValidationError).message).toEqual('The following field is invalid: slugField')
    }
  })

  it('should use optimized updateOne', async () => {
    const post = await payload.create({
      collection: 'posts',
      data: {
        text: 'other text (should not be nuked)',
        title: 'hello',
        group: { text: 'in group' },
        tab: { text: 'in tab' },
        arrayWithIDs: [{ text: 'some text' }],
      },
    })
    const res = (await payload.db.updateOne({
      where: { id: { equals: post.id } },
      data: {
        title: 'hello updated',
        group: { text: 'in group updated' },
        tab: { text: 'in tab updated' },
      },
      collection: 'posts',
    })) as unknown as DataFromCollectionSlug<'posts'>

    expect(res.title).toBe('hello updated')
    expect(res.text).toBe('other text (should not be nuked)')
    expect(res.group?.text).toBe('in group updated')
    expect(res.tab?.text).toBe('in tab updated')
    expect(res.arrayWithIDs).toHaveLength(1)
    expect(res.arrayWithIDs?.[0]?.text).toBe('some text')
  })

  it('should use optimized updateMany', async () => {
    const post1 = await payload.create({
      collection: 'posts',
      data: {
        text: 'other text (should not be nuked)',
        title: 'hello',
        group: { text: 'in group' },
        tab: { text: 'in tab' },
        arrayWithIDs: [{ text: 'some text' }],
      },
    })
    const post2 = await payload.create({
      collection: 'posts',
      data: {
        text: 'other text 2 (should not be nuked)',
        title: 'hello',
        group: { text: 'in group' },
        tab: { text: 'in tab' },
        arrayWithIDs: [{ text: 'some text' }],
      },
    })

    const res = (await payload.db.updateMany({
      where: { id: { in: [post1.id, post2.id] } },
      data: {
        title: 'hello updated',
        group: { text: 'in group updated' },
        tab: { text: 'in tab updated' },
      },
      collection: 'posts',
    })) as unknown as Array<DataFromCollectionSlug<'posts'>>

    expect(res).toHaveLength(2)
    const resPost1 = res?.find((r) => r.id === post1.id)
    const resPost2 = res?.find((r) => r.id === post2.id)
    expect(resPost1?.text).toBe('other text (should not be nuked)')
    expect(resPost2?.text).toBe('other text 2 (should not be nuked)')

    for (const post of res) {
      expect(post.title).toBe('hello updated')
      expect(post.group?.text).toBe('in group updated')
      expect(post.tab?.text).toBe('in tab updated')
      expect(post.arrayWithIDs).toHaveLength(1)
      expect(post.arrayWithIDs?.[0]?.text).toBe('some text')
    }
  })

  it('should allow to query like by ID with draft: true', async () => {
    const category = await payload.create({
      collection: 'categories',
      data: { title: 'category123' },
    })
    const res = await payload.find({
      collection: 'categories',
      draft: true,
      // eslint-disable-next-line jest/no-conditional-in-test
      where: { id: { like: typeof category.id === 'number' ? `${category.id}` : category.id } },
    })
    expect(res.docs).toHaveLength(1)
    expect(res.docs[0].id).toBe(category.id)
  })

  it('should allow incremental number update', async () => {
    const post = await payload.create({ collection: 'posts', data: { number: 1, title: 'post' } })

    const res = await payload.db.updateOne({
      data: {
        number: {
          $inc: 10,
        },
      },
      collection: 'posts',
      where: { id: { equals: post.id } },
    })

    expect(res.number).toBe(11)

    const res2 = await payload.db.updateOne({
      data: {
        number: {
          $inc: -3,
        },
      },
      collection: 'posts',
      where: { id: { equals: post.id } },
    })

    expect(res2.number).toBe(8)
  })

  it('should support x3 nesting blocks', async () => {
    const res = await payload.create({
      collection: 'posts',
      data: {
        title: 'title',
        blocks: [
          {
            blockType: 'block-third',
            nested: [
              {
                blockType: 'block-fourth',
                nested: [],
              },
            ],
          },
        ],
      },
    })

    expect(res.blocks).toHaveLength(1)
    expect(res.blocks[0]?.nested).toHaveLength(1)
    expect(res.blocks[0]?.nested[0]?.nested).toHaveLength(0)
  })

  it('should ignore blocks that exist in the db but not in the config', async () => {
    // not possible w/ SQL anyway
    // eslint-disable-next-line jest/no-conditional-in-test
    if (payload.db.name !== 'mongoose') {
      return
    }

    const res = await payload.db.collections['blocks-docs']?.collection.insertOne({
      testBlocks: [
        {
          id: '1',
          blockType: 'cta',
          text: 'valid block',
        },
        {
          id: '2',
          blockType: 'cta_2',
          text: 'non-valid block',
        },
      ],
      testBlocksLocalized: {
        en: [
          {
            id: '1',
            blockType: 'cta',
            text: 'valid block',
          },
          {
            id: '2',
            blockType: 'cta_2',
            text: 'non-valid block',
          },
        ],
      },
    })

    const doc = await payload.findByID({
      collection: 'blocks-docs',
      id: res?.insertedId?.toHexString() as string,
      locale: 'en',
    })
    expect(doc.testBlocks).toHaveLength(1)
    expect(doc.testBlocks[0].id).toBe('1')
    expect(doc.testBlocksLocalized).toHaveLength(1)
    expect(doc.testBlocksLocalized[0].id).toBe('1')
  })

  it('should CRUD with blocks as JSON in SQL adapters', async () => {
    // eslint-disable-next-line jest/no-conditional-in-test
    if (!('drizzle' in payload.db)) {
      return
    }

    process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = 'true'
    payload.db.blocksAsJSON = true
    delete payload.db.pool
    await payload.db.init()
    await payload.db.connect()
    expect(payload.db.tables.blocks_docs.testBlocks).toBeDefined()
    expect(payload.db.tables.blocks_docs_locales.testBlocksLocalized).toBeDefined()
    const res = await payload.create({
      collection: 'blocks-docs',
      data: {
        testBlocks: [{ blockType: 'cta', text: 'text' }],
        testBlocksLocalized: [{ blockType: 'cta', text: 'text-localized' }],
      },
    })
    expect(res.testBlocks[0]?.text).toBe('text')
    expect(res.testBlocksLocalized[0]?.text).toBe('text-localized')
    const res_es = await payload.update({
      collection: 'blocks-docs',
      id: res.id,
      locale: 'es',
      data: {
        testBlocksLocalized: [{ blockType: 'cta', text: 'text-localized-es' }],
        testBlocks: [{ blockType: 'cta', text: 'text_updated' }],
      },
    })
    expect(res_es.testBlocks[0]?.text).toBe('text_updated')
    expect(res_es.testBlocksLocalized[0]?.text).toBe('text-localized-es')
    const res_all = await payload.findByID({
      collection: 'blocks-docs',
      id: res.id,
      locale: 'all',
    })
    expect(res_all.testBlocks[0]?.text).toBe('text_updated')
    expect(res_all.testBlocksLocalized.es[0]?.text).toBe('text-localized-es')
    expect(res_all.testBlocksLocalized.en[0]?.text).toBe('text-localized')
    payload.db.blocksAsJSON = false
    process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = 'false'
    delete payload.db.pool
    await payload.db.init()
    await payload.db.connect()
  })
})

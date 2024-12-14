import { beforeAll, afterAll, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { describe } from 'node:test'
import { execSync } from 'node:child_process'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    execSync('npm run knex migrate:latest')
  })

  afterAll(async () => {
    execSync('npm run knex migrate:rollback --all')
  })

  it('should be able to create a new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'Teste',
        amount: 100,
        type: 'credit',
      })
      .expect(201)
  })

  it('should be able to list all transaction', async () => {
    const response = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Teste',
        amount: 100,
        type: 'credit',
      })
      .expect(201)

    const cookies = response.get('Set-Cookie')

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies!)
      .expect(200)

    expect(listTransactionsResponse.body).toMatchObject({
      transactions: [
        {
          id: expect.any(String),
          session_id: expect.any(String),
          title: 'Teste',
          amount: 100,
          created_at: expect.any(String),
        },
      ],
    })
  })

  it('should be able get a specific transaction', async () => {
    const response = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Teste',
        amount: 100,
        type: 'credit',
      })
      .expect(201)

    const cookies = response.get('Set-Cookie')

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies!)
      .expect(200)

    expect(listTransactionsResponse.body).toMatchObject({
      transactions: [
        {
          id: expect.any(String),
          session_id: expect.any(String),
          title: 'Teste',
          amount: 100,
          created_at: expect.any(String),
        },
      ],
    })

    const transactionId = listTransactionsResponse.body.transactions[0].id
    console.log(transactionId)

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies!)
      .expect(200)

    expect(getTransactionResponse.body).toEqual({
      id: expect.any(String),
      session_id: expect.any(String),
      title: 'Teste',
      amount: 100,
      created_at: expect.any(String),
    })
  })

  it('should be able to get the summary', async () => {
    const response1 = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Teste',
        amount: 1000,
        type: 'credit',
      })
      .expect(201)

    const cookies = response1.get('Set-Cookie')

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies!)
      .send({
        title: 'Teste',
        amount: 300,
        type: 'debit',
      })
      .expect(201)

    const summaryResponse = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies!)
      .expect(200)

    expect(summaryResponse.body).toEqual({
      summary: {
        amount: 700,
      },
    })
  })
})

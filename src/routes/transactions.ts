import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function transactionsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req, res) => {
      const { sessionId } = req.cookies

      const transactions = await knex('transactions')
        .where('session_id', sessionId)
        .select()

      const response = {
        transactions,
      }

      res.status(200).send(response)
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req, res) => {
      const { sessionId } = req.cookies
      const getTransactionByIdParamsSchema = z.object({
        id: z.string().uuid({
          message: 'Forneça um UUID válido',
        }),
      })

      const result = getTransactionByIdParamsSchema.safeParse(req.params)

      if (!result.success) {
        return res.status(400).send({
          message: `${result.error.format().id?._errors}`,
        })
      }

      const transaction = await knex('transactions')
        .where({
          id: result.data.id,
          session_id: sessionId,
        })
        .select()
        .first()

      if (!transaction) {
        res.status(404).send()
      }

      res.status(200).send(transaction)
    },
  )

  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req, res) => {
      const { sessionId } = req.cookies
      const summary = await knex('transactions')
        .where('session_id', sessionId)
        .sum('amount', { as: 'amount' })
        .first()

      res.status(200).send({ summary })
    },
  )

  app.post('/', async (req, res) => {
    const { body } = req

    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })
    const { title, amount, type } = createTransactionBodySchema.parse(body)

    let { sessionId } = req.cookies

    if (!sessionId) {
      sessionId = randomUUID()

      res.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })

    res.status(201).send()
  })
}

// eslint-disable-next-line
import { Knex } from 'knex'
import { Transactions } from '../models'

declare module 'knex/types/tables' {
  export interface Tables {
    transactions: Transactions
  }
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../src/app");
const node_test_1 = require("node:test");
const node_child_process_1 = require("node:child_process");
(0, node_test_1.describe)('Transactions routes', () => {
    (0, vitest_1.beforeAll)(async () => {
        await app_1.app.ready();
    });
    (0, vitest_1.afterAll)(async () => {
        await app_1.app.close();
    });
    (0, vitest_1.beforeEach)(async () => {
        (0, node_child_process_1.execSync)('npm run knex migrate:latest');
    });
    (0, vitest_1.afterAll)(async () => {
        (0, node_child_process_1.execSync)('npm run knex migrate:rollback --all');
    });
    (0, vitest_1.it)('should be able to create a new transaction', async () => {
        await (0, supertest_1.default)(app_1.app.server)
            .post('/transactions')
            .send({
            title: 'Teste',
            amount: 100,
            type: 'credit',
        })
            .expect(201);
    });
    (0, vitest_1.it)('should be able to list all transaction', async () => {
        const response = await (0, supertest_1.default)(app_1.app.server)
            .post('/transactions')
            .send({
            title: 'Teste',
            amount: 100,
            type: 'credit',
        })
            .expect(201);
        const cookies = response.get('Set-Cookie');
        const listTransactionsResponse = await (0, supertest_1.default)(app_1.app.server)
            .get('/transactions')
            .set('Cookie', cookies)
            .expect(200);
        (0, vitest_1.expect)(listTransactionsResponse.body).toMatchObject({
            transactions: [
                {
                    id: vitest_1.expect.any(String),
                    session_id: vitest_1.expect.any(String),
                    title: 'Teste',
                    amount: 100,
                    created_at: vitest_1.expect.any(String),
                },
            ],
        });
    });
    (0, vitest_1.it)('should be able get a specific transaction', async () => {
        const response = await (0, supertest_1.default)(app_1.app.server)
            .post('/transactions')
            .send({
            title: 'Teste',
            amount: 100,
            type: 'credit',
        })
            .expect(201);
        const cookies = response.get('Set-Cookie');
        const listTransactionsResponse = await (0, supertest_1.default)(app_1.app.server)
            .get('/transactions')
            .set('Cookie', cookies)
            .expect(200);
        (0, vitest_1.expect)(listTransactionsResponse.body).toMatchObject({
            transactions: [
                {
                    id: vitest_1.expect.any(String),
                    session_id: vitest_1.expect.any(String),
                    title: 'Teste',
                    amount: 100,
                    created_at: vitest_1.expect.any(String),
                },
            ],
        });
        const transactionId = listTransactionsResponse.body.transactions[0].id;
        console.log(transactionId);
        const getTransactionResponse = await (0, supertest_1.default)(app_1.app.server)
            .get(`/transactions/${transactionId}`)
            .set('Cookie', cookies)
            .expect(200);
        (0, vitest_1.expect)(getTransactionResponse.body).toEqual({
            id: vitest_1.expect.any(String),
            session_id: vitest_1.expect.any(String),
            title: 'Teste',
            amount: 100,
            created_at: vitest_1.expect.any(String),
        });
    });
    (0, vitest_1.it)('should be able to get the summary', async () => {
        const response1 = await (0, supertest_1.default)(app_1.app.server)
            .post('/transactions')
            .send({
            title: 'Teste',
            amount: 1000,
            type: 'credit',
        })
            .expect(201);
        const cookies = response1.get('Set-Cookie');
        await (0, supertest_1.default)(app_1.app.server)
            .post('/transactions')
            .set('Cookie', cookies)
            .send({
            title: 'Teste',
            amount: 300,
            type: 'debit',
        })
            .expect(201);
        const summaryResponse = await (0, supertest_1.default)(app_1.app.server)
            .get('/transactions/summary')
            .set('Cookie', cookies)
            .expect(200);
        (0, vitest_1.expect)(summaryResponse.body).toEqual({
            summary: {
                amount: 700,
            },
        });
    });
});

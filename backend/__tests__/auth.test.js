const request = require('supertest');
const app = require('../src/app');
const database = require('../src/database');
const sequelize = database.connection;

// Antes de todos os testes, limpa e prepara a base de dados de teste
beforeAll(async () => {
    await sequelize.sync({ force: true }); // Apaga e recria todas as tabelas
});

// Depois de todos os testes, fecha a conexão com a base de dados
afterAll(async () => {
    await sequelize.close();
});

describe('Autenticação', () => {
    it('deve permitir o registo de um novo utilizador', async () => {
        const response = await request(app)
            .post('/api/register')
            .send({
                nome: 'Utilizador de Teste',
                email: 'teste@email.com',
                senha: 'password123',
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.email).toBe('teste@email.com');
    });

    it('deve permitir o login de um utilizador existente', async () => {
        const response = await request(app)
            .post('/api/login')
            .send({
                email: 'teste@email.com',
                senha: 'password123',
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
    });

    it('NÃO deve permitir o login com uma senha incorreta', async () => {
        const response = await request(app)
            .post('/api/login')
            .send({
                email: 'teste@email.com',
                senha: 'wrongpassword',
            });

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Senha incorreta.');
    });

    it('NÃO deve permitir o registo de um e-mail já existente', async () => {
        const response = await request(app)
            .post('/api/register')
            .send({
                nome: 'Outro Utilizador',
                email: 'teste@email.com', // E-mail repetido
                senha: 'password123',
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Este e-mail já está em uso.');
    });
});
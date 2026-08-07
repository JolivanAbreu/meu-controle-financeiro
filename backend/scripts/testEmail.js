require('dotenv').config();
const mailer = require('../src/config/mailer');

async function main() {
  const destinatario = process.argv[2];

  console.log('MAIL_HOST:', process.env.MAIL_HOST || '(ausente)');
  console.log('MAIL_PORT:', process.env.MAIL_PORT || '(ausente)');
  console.log('MAIL_USER:', process.env.MAIL_USER || '(ausente)');
  console.log('MAIL_PASS:', process.env.MAIL_PASS ? '*'.repeat(process.env.MAIL_PASS.length) : '(ausente)');
  console.log('');

  if (!mailer.isConfigured()) {
    console.error('MAIL_HOST, MAIL_USER ou MAIL_PASS não estão definidos no .env. Nada a testar.');
    process.exit(1);
  }

  console.log('Testando conexão e autenticação com o servidor SMTP...');
  const result = await mailer.verifyConnection().catch((error) => ({ ok: false, error }));

  if (!result.ok) {
    console.error('FALHOU:', result.error ? result.error.message : result.reason);
    process.exit(1);
  }

  console.log('Conexão e autenticação OK.');

  if (!destinatario) {
    console.log('\nNenhum e-mail de destino informado — pulando envio de teste.');
    console.log('Uso: node scripts/testEmail.js seuemail@exemplo.com');
    return;
  }

  console.log(`\nEnviando e-mail de teste para ${destinatario}...`);
  await mailer.sendMail({
    to: destinatario,
    subject: 'Teste de configuração de e-mail — Meu Controle Financeiro',
    html: '<p>Se você recebeu este e-mail, sua configuração SMTP está funcionando corretamente.</p>',
  });
  console.log('E-mail de teste enviado com sucesso.');
}

main().catch((error) => {
  console.error('Erro inesperado:', error);
  process.exit(1);
});
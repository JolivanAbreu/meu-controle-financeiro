const crypto = require('crypto');
const User = require('../models/User');
const mailer = require('../config/mailer');

const TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

class PasswordResetController {
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Informe o e-mail.' });
      }

      const genericMessage = {
        message: 'Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha.',
      };

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.json(genericMessage);
      }

      const rawToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = hashToken(rawToken);
      user.resetPasswordExpires = new Date(Date.now() + TOKEN_TTL_MS);
      await user.save();

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

      await mailer.sendMail({
        to: user.email,
        subject: 'Redefinição de senha',
        html: `
          <p>Olá, ${user.nome}</p>
          <p>Recebemos um pedido para redefinir sua senha. Clique no link abaixo (válido por 1 hora):</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>Se você não pediu isso, pode ignorar este e-mail com segurança.</p>
        `,
      });

      return res.json(genericMessage);
    } catch (error) {
      console.error('ERRO AO SOLICITAR REDEFINIÇÃO DE SENHA:', error);
      return res.status(500).json({ error: 'Falha ao processar a solicitação.', details: error.message });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, novaSenha } = req.body;
      if (!token || !novaSenha) {
        return res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
      }
      if (novaSenha.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
      }

      const hashedToken = hashToken(token);
      const user = await User.findOne({ where: { resetPasswordToken: hashedToken } });

      if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
        return res.status(400).json({ error: 'Link inválido ou expirado. Solicite uma nova redefinição.' });
      }

      user.senha = novaSenha;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      return res.json({ message: 'Senha redefinida com sucesso.' });
    } catch (error) {
      console.error('ERRO AO REDEFINIR SENHA:', error);
      return res.status(500).json({ error: 'Falha ao redefinir senha.', details: error.message });
    }
  }
}

module.exports = new PasswordResetController();
// backend/src/controllers/UserController.js

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('../models/User');

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

async function sendVerificationEmail(user, rawToken) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verifyLink = `${frontendUrl}/verify-email?token=${rawToken}`;

  if (process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT || 465,
        secure: (process.env.MAIL_PORT || 465) == 465,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Meu Controle Financeiro" <${process.env.MAIL_USER}>`,
        to: user.email,
        subject: 'Confirme seu e-mail',
        html: `
          <p>Olá, ${user.nome}</p>
          <p>Obrigado por se cadastrar! Confirme seu e-mail clicando no link abaixo:</p>
          <p><a href="${verifyLink}">${verifyLink}</a></p>
          <p>Se você não fez esse cadastro, pode ignorar este e-mail.</p>
        `,
      });
    } catch (mailError) {
      // Não bloqueia o cadastro se o envio falhar — só loga o problema.
      console.error('Falha ao enviar e-mail de confirmação:', mailError);
    }
  } else {
    // Configuração de e-mail ausente — comportamento idêntico ao do
    // "esqueci minha senha": não bloqueia o fluxo, só loga o link.
    console.warn('MAIL_* não configurado — link de confirmação não enviado:', verifyLink);
  }
}

class UserController {
  async store(req, res) {
    try {
      const userExists = await User.findOne({ where: { email: req.body.email } });

      if (userExists) {
        return res.status(400).json({ error: 'Este e-mail já está em uso.' });
      }

      const rawToken = crypto.randomBytes(32).toString('hex');

      const { id, nome, email } = await User.create({
        ...req.body,
        emailVerified: false,
        emailVerificationToken: hashToken(rawToken),
      });

      const createdUser = { id, nome, email };
      await sendVerificationEmail(createdUser, rawToken);

      return res.status(201).json(createdUser);
    } catch (error) {
      return res.status(500).json({ error: 'Falha ao criar o usuário.', details: error.message });
    }
  }

  // --- NOVO: confirma o e-mail a partir do token recebido ---
  async verifyEmail(req, res) {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({ error: 'Token não informado.' });
      }

      const user = await User.findOne({ where: { emailVerificationToken: hashToken(token) } });
      if (!user) {
        return res.status(400).json({ error: 'Link de confirmação inválido ou já utilizado.' });
      }

      user.emailVerified = true;
      user.emailVerificationToken = null;
      await user.save();

      return res.json({ message: 'E-mail confirmado com sucesso!' });
    } catch (error) {
      return res.status(500).json({ error: 'Falha ao confirmar e-mail.', details: error.message });
    }
  }

  // --- NOVO: reenvia o e-mail de confirmação (rota privada) ---
  async resendVerification(req, res) {
    try {
      const user = await User.findByPk(req.userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      if (user.emailVerified) {
        return res.json({ message: 'Este e-mail já está confirmado.' });
      }

      const rawToken = crypto.randomBytes(32).toString('hex');
      user.emailVerificationToken = hashToken(rawToken);
      await user.save();

      await sendVerificationEmail(user, rawToken);

      return res.json({ message: 'E-mail de confirmação reenviado.' });
    } catch (error) {
      return res.status(500).json({ error: 'Falha ao reenviar confirmação.', details: error.message });
    }
  }

  // --- Perfil do usuário autenticado ---
  async show(req, res) {
    try {
      const user = await User.findByPk(req.userId, {
        attributes: ['id', 'nome', 'email', 'emailVerified'],
      });
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ error: 'Falha ao buscar perfil.', details: error.message });
    }
  }

  async update(req, res) {
    try {
      const { nome, email, senhaAtual, novaSenha } = req.body;
      const user = await User.findByPk(req.userId);

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      if (email && email !== user.email) {
        const emailEmUso = await User.findOne({ where: { email } });
        if (emailEmUso) {
          return res.status(400).json({ error: 'Este e-mail já está em uso.' });
        }
        // Trocar de e-mail exige nova confirmação.
        user.emailVerified = false;
        const rawToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationToken = hashToken(rawToken);
        user.email = email;
        await sendVerificationEmail(user, rawToken);
      }

      if (novaSenha) {
        if (!senhaAtual) {
          return res.status(400).json({ error: 'Informe a senha atual para definir uma nova senha.' });
        }
        const senhaCorreta = await bcrypt.compare(senhaAtual, user.senha_hash);
        if (!senhaCorreta) {
          return res.status(401).json({ error: 'Senha atual incorreta.' });
        }
        if (novaSenha.length < 6) {
          return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
        }
        user.senha = novaSenha;
      }

      if (nome) user.nome = nome;

      await user.save();

      return res.json({
        id: user.id,
        nome: user.nome,
        email: user.email,
        emailVerified: user.emailVerified,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Falha ao atualizar perfil.', details: error.message });
    }
  }
}

module.exports = new UserController();
// backend/src/controllers/SessionController.js

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

class SessionController {
  async store(req, res) {
    try {
      const { email, senha } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado." });
      }

      const isPasswordCorrect = await bcrypt.compare(senha, user.senha_hash);
      if (!isPasswordCorrect) {
        return res.status(401).json({ error: "Senha incorreta." });
      }

      const { id, nome } = user;

      const token = jwt.sign({ id }, process.env.APP_SECRET, {
        expiresIn: "7d",
      });

      return res.json({
        user: {
          id,
          nome,
          email,
        },
        token,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Falha no login.", details: error.message });
    }
  }
}

module.exports = new SessionController();

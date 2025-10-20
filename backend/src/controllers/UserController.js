// backend/src/controllers/UserController.js

const User = require('../models/User');

class UserController {
  async store(req, res) {
    try {
      const userExists = await User.findOne({ where: { email: req.body.email } });

      if (userExists) {
        return res.status(400).json({ error: 'Este e-mail já está em uso.' });
      }

      const { id, nome, email } = await User.create(req.body);

      return res.status(201).json({ id, nome, email });
    } catch (error) {
      return res.status(500).json({ error: 'Falha ao criar o usuário.', details: error.message });
    }
  }
}

module.exports = new UserController();
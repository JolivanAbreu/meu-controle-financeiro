// backend/src/middlewares/rateLimiter.js

const rateLimit = require('express-rate-limit');

// Limita tentativas de login/registro/redefinição de senha por IP,
// para dificultar ataques de força bruta.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 tentativas por IP nesse intervalo
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
});

module.exports = { authLimiter };
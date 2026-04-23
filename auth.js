const jwt = require("jsonwebtoken");

module.exports = {
  auth: function auth(req, res, next) {
    const header = req.headers.authorization;

    if (!header) {
      return res.status(401).json({ message: "Нет токена" });
    }

    const token = header.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = decoded; // { userId: ... }

      next();
    } catch (e) {
      return res.status(401).json({ message: "Невалидный токен" });
    }
  },
};

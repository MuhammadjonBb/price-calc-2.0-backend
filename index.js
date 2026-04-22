const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const products = require("./data/products.json");

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = "secret123"; // секрет для подписи JWT, в реальном приложении его нужно хранить в переменных окружения

// заранее заданные пользователи
const users = [
  {
    username: "admin",
    password: "$2b$10$qtrbm5WBJ1jE1CypIigxW.qIlrQw7XUo6newek8pGwxO9PKdH8f5i", // сюда вставляешь хэш
  },
];

app.get("/products", (req, res) => {
  res.json(products);
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = users.find((u) => u.username === username); // находим пользователя по имени

  if (!user) {
    // если пользователя нет, возвращаем ошибку
    return res.status(401).json({ message: "Нет такого пользователя" });
  }

  const isMatch = await bcrypt.compare(password, user.password); // сравниваем введённый пароль с хэшем

  if (!isMatch) {
    // если пароли не совпали, возвращаем ошибку
    return res.status(401).json({ message: "Неверный пароль" });
  }

  const token = jwt.sign({ username: user.username }, SECRET, {
    // создаём токен с полезной нагрузкой (username) и секретом
    expiresIn: "1h", // токен будет действовать 1 час
  });

  res.json({ token }); // возвращаем токен клиенту
});

app.listen(3000);

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const products = require("./data/products.json");
const { auth } = require("./auth");
const nanoid = require("nanoid").nanoid;

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = process.env.JWT_SECRET; // секрет для подписи JWT, в реальном приложении его нужно хранить в переменных окружения

// заранее заданные пользователи
const users = [
  {
    username: process.env.ADMIN_USERNAME, // сюда вставляешь имя пользователя из .env
    password: process.env.ADMIN_PSW, // сюда вставляешь хэш из .env
    _id: 1,
  },
];

const orders = [
  {
    _id: nanoid(),
    name: "Заказ 1",
    agent: "Агент 1",
    statusCode: 0,
    products: [],
    user: users[0]._id,
    createdAt: new Date(),
    comment: "Комментарий к заказу 1",
  },
  {
    _id: nanoid(),
    name: "Заказ 2",
    agent: "Агент 2",
    statusCode: 1,
    products: [],
    user: users[0]._id,
    createdAt: new Date(),
    comment: "Комментарий к заказу 2",
  },
];

app.get("/products", auth, (req, res) => {
  res.json(products);
});

app.get("/orders", auth, (req, res) => {
  const userId = req.user._id; // получаем ID пользователя из запроса, который был установлен в middleware auth
  const userOrders = orders.filter((order) => order.user === userId); // фильтруем заказы по ID пользователя

  res.json(userOrders);
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

  const token = jwt.sign({ username: user.username, _id: user._id }, SECRET, {
    // создаём токен с полезной нагрузкой (username) и секретом
    expiresIn: "1h", // токен будет действовать 1 час
  });

  res.json({ token }); // возвращаем токен клиенту
});

app.listen(3000);

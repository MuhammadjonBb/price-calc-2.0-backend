require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const products = require("./data/products.json");
const { auth } = require("./auth");
const nanoid = require("nanoid").nanoid;
const { google } = require("googleapis");
const supabase = require("./db");

require("dotenv").config();
const SPREADSHEET_ID = process.env.SHEET_ID;

const authClient = new google.auth.GoogleAuth({
  keyFile:
    process.env.NODE_ENV === "production"
      ? "/etc/secrets/onyx-ivy-497511-m3-dc747c4e3f99.json"
      : "./onyx-ivy-497511-m3-dc747c4e3f99.json", // ваше имя файла
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://192.168.100.33:5173",
      "https://td-price.netlify.app",
    ],
    credentials: true, // разрешаем отправлять куки и заголовки авторизации
  }),
);
app.use(express.json());

const SECRET = process.env.JWT_SECRET; // секрет для подписи JWT, в реальном приложении его нужно хранить в переменных окружения

// заранее заданные пользователи
const users = [
  {
    username: process.env.ADMIN_USERNAME, // сюда вставляешь имя пользователя из .env
    password: process.env.ADMIN_PSW, // сюда вставляешь хэш из .env
    _id: 1,
    name: "Админ",
    phone: "+998(90) 123 45 67",
    role: "Администратор",
  },
  {
    username: process.env.GAYRAT_USERNAME, // сюда вставляешь имя пользователя из .env
    password: process.env.GAYRAT_PSW, // сюда вставляешь хэш из .env
    _id: 2,
    name: "Гайрат Файзиев",
    phone: "+998 (90) 978 44 64",
    role: "Менеджер по продажам",
  },
  {
    username: process.env.AXMAD_USERNAME, // сюда вставляешь имя пользователя из .env
    password: process.env.AXMAD_PSW, // сюда вставляешь хэш из .env
    _id: 3,
    name: "Ахмадбек Давлетов",
    phone: "+998 91 785 14 52",
    role: "Менеджер по закупкам",
  },
];

// const orders = []; // массив для хранения заказов, в реальном приложении это должна быть база данных

// GET / - проверка работоспособности сервера
app.get("/", (req, res) => {
  res.send("OK");
});

app.get("/products", auth, async (req, res) => {
  try {
    const sheet = req.query.sheet || "TASHKENT"; // дефолт если не передан
    const sheets = google.sheets({ version: "v4", auth: authClient });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheet}!A:D`,
    });

    const [headers, ...rows] = response.data.values;
    const products = rows.map((row) =>
      Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ""])),
    );

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// app.get("/orders", auth, (req, res) => {
//   const userId = req.user._id; // получаем ID пользователя из запроса, который был установлен в middleware auth
//   const userOrders = orders.filter((order) => order.user === userId); // фильтруем заказы по ID пользователя

//   res.json(userOrders);
// });

// app.post("/orders", auth, (req, res) => {
//   try {
//     const userId = req.user._id;
//     const {
//       name,
//       agent,
//       statusCode,
//       products: orderProducts,
//       comment,
//       roadExpense,
//     } = req.body;

//     if (!name || !agent || statusCode === undefined) {
//       return res.status(400).json({ message: "Отсутствуют обязательные поля" });
//     }

//     const newOrder = {
//       _id: nanoid(),
//       name,
//       agent,
//       statusCode,
//       products: orderProducts || [],
//       user: userId,
//       createdAt: new Date(),
//       comment,
//       roadExpense: roadExpense || 0,
//     };

//     orders.unshift(newOrder);

//     res.status(201).json(newOrder);
//   } catch (error) {
//     res.status(500).json({ message: "Ошибка сервера", error: error.message });
//   }
// });

// app.delete("/orders/:id", auth, (req, res) => {
//   const userId = req.user._id;
//   const orderId = req.params.id;

//   const orderIndex = orders.findIndex(
//     (order) => order._id === orderId && order.user === userId,
//   );

//   if (orderIndex === -1) {
//     return res.status(404).json({ message: "Заказ не найден" });
//   }

//   orders.splice(orderIndex, 1);
//   res.json({ message: "Заказ удалён" });
// });

app.get("/orders", auth, async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", req.user._id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

app.post("/orders", auth, async (req, res) => {
  const {
    name,
    agent,
    statusCode,
    products: orderProducts,
    comment,
    roadExpense,
  } = req.body;

  if (!name || !agent || statusCode === undefined) {
    return res.status(400).json({ message: "Отсутствуют обязательные поля" });
  }

  const newOrder = {
    id: nanoid(),
    name,
    agent,
    status_code: statusCode,
    products: orderProducts || [],
    user_id: req.user._id,
    comment,
    road_expense: roadExpense || 0,
  };

  const { data, error } = await supabase
    .from("orders")
    .insert(newOrder)
    .select()
    .single();
  if (error) return res.status(500).json({ message: error.message });
  res.status(201).json(data);
});

app.delete("/orders/:id", auth, async (req, res) => {
  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user._id);
  if (error) return res.status(500).json({ message: error.message });
  res.json({ message: "Заказ удалён" });
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

  const token = jwt.sign(
    { username: user.username, _id: user._id, name: user.name },
    SECRET,
    {
      // создаём токен с полезной нагрузкой (username) и секретом
      expiresIn: "1h", // токен будет действовать 1 час
    },
  );
  const userData = {
    name: user.name,
    phone: user.phone,
    role: user.role,
  };
  res.json({ token, user: userData }); // возвращаем токен и данные пользователя
});

app.post("/api/kp", async (req, res) => {
  const { agent, items, total } = req.body;

  const { data, error } = await supabase
    .from("kp")
    .insert({ agent, items, total })
    .select("id, created_at")
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ id: data.id, created_at: data.created_at });
});

// // опционально — получить КП по id (для проверки/просмотра по QR)
// app.get("/api/kp/:id", async (req, res) => {
//   const { data, error } = await supabase
//     .from("kp")
//     .select("*")
//     .eq("id", req.params.id)
//     .single();

//   if (error) return res.status(404).json({ error: "Not found" });
//   res.json(data);
// });

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running");
});

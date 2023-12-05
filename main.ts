import express from "express";
import dotenv from "dotenv";
import { Request, Response } from "express";
import { resolve } from "path";
import pg from "pg";
// import expressSession from "express-session";
import { checkPassword, hashPassword } from "./hash";
export type UserListType = Array<{ username: string; password: string }>;
dotenv.config();
//<-------------------------------------------------------------------------------------------------------------------->
const app = express();
const port = 8080;
const yoClient = new pg.Client({
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
});
yoClient.connect();
//<-------------------------------------------------------------------------------------------------------------------->
declare module "express-session" {
  interface SessionData {
    username?: string;
    grant?: any;
  }
}
//<-------------------------------------------------------------------------------------------------------------------->

//<---APP.USE--------------------------------------------------------------------------------------------------------->
// app.use(loggerMiddleware);
app.use(express.static("public/html/"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//<---APP.GET--------------------------------------------------------------------------------------------------------->
app.get("/", (req, res) => {
  res.send("hello world");
});

app.get("/user", async (req, res) => {
  let queryResult = await yoClient.query("SELECT * FROM USER");
  res.json(queryResult.rows);
});

app.get("/product", (req, res) => {
  res.redirect("/product.html");
});

app.get("/about_us", (req, res) => {
  res.redirect("/about_us.html");
});
app.get("/login", (req, res) => {
  res.redirect("/login.html");
});

app.get("/register", (req, res) => {
  res.redirect("/register.html");
});

//<------------------------------------------------------------------------------------------------------------------>
app.post("/register", async (req, res) => {
  console.log(req.body.email, req.body.passwordInput1, req.body.passwordInput2);

  // if (req.body.email == undefined || req.body.email == "") {
  //   res.status(400).json({ message: "email can not be null" });
  // } else if (
  //   req.body.passwordInput1 == undefined ||
  //   req.body.passwordInput1 == ""
  // ) {
  //   res.status(400).json({ message: "password can not be null" });
  // } else if (
  //   req.body.passwordInput2 == undefined ||
  //   req.body.passwordInput2 == ""
  // ) {
  //   res.status(400).json({ message: "password verification can not be null" });
  // } else if (req.body.passwordInput1 != req.body.passwordInput2) {
  //   res.status(400).json({ message: "Both passwords are not the same" });
  // } else {
  let queryResult = await yoClient.query(
    "SELECT username from users WHERE username = $1",
    [req.body.username]
  );

  if (queryResult.rowCount != 0) {
    res.status(400).json({ message: "username already exists" });
  } else {
    let hashed = await hashPassword(req.body.passwordInput1);
    await yoClient.query(
      "INSERT INTO users (fullname,username,email,phonenumber,password) VALUES ($1,$2,$3,$4,$5)",
      [
        req.body.fullname,
        req.body.username,
        req.body.email,
        req.body.phonenumber,
        hashed,
      ]
    );

    res.json({ message: "register success" });
  }
});
// });
app.post("/login", async (req, res) => {
  console.log(req.body.emailaddress, req.body.password);

  // see if the username exist , and get its hashed password
  let queryResult = await yoClient.query(
    "SELECT password from users WHERE username = $1",
    [req.body.email]
  );

  if (queryResult.rowCount != 0) {
    // if exists, compare the hashed password to password input

    // console.log(queryResult.rows[0].password);
    let compareResult = await checkPassword({
      plainPassword: req.body.password,
      hashedPassword: queryResult.rows[0].password,
    });

    if (compareResult) {
      req.session.username = req.body.emailaddress;
      res.json({ message: "login success" });
    } else {
      res.json({ message: "password is incorrect" });
    }
  } else {
    res.json({ message: "username is incorrect" });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on http://localhost:${port}`);
});

//<----404----------------------------------------------------------------------------------------------------------->
app.use((req: Request, res: Response) => {
  res
    .status(404)
    .sendFile(
      resolve(
        "/Users/EdgarChung/Documents/Coding/Project/c29-tw-grp2/public/html/404.html"
      )
    );
});

import express from "express";
import { Request, Response } from "express";
import { resolve } from "path";
// import expressSession from "express-session";
import { checkPassword, hashPassword } from "./hash";
import { pgClient } from "./pgClient";
import expressSession from "express-session";
export type UserListType = Array<{ username: string; password: string }>;

//<-------------------------------------------------------------------------------------------------------------------->
const app = express();
const port = 8080;

pgClient.connect();
//<-------------------------------------------------------------------------------------------------------------------->
declare module "express-session" {
  interface SessionData {
    username?: string;
    grant?: any;
    email?: string;
  }
}

//<---APP.USE--------------------------------------------------------------------------------------------------------->
// app.use(loggerMiddleware);
app.use(express.static("public/html/"));
app.use(express.static("public/image"));

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  expressSession({
    secret: "Tecky Academy teaches typescript",
    resave: true,
    saveUninitialized: true,
  })
);

// app.get("/login", (req, res) =>
//   res.sendFile(__dirname + "/public/html/login.html")
// );

//<---APP.GET--------------------------------------------------------------------------------------------------------->
app.get("/", (req, res) => {
  res.send("hello world");
});

app.get("/user", async (req, res) => {
  let queryResult = await pgClient.query("SELECT * FROM USER");
  res.json(queryResult.rows);
});

app.get("/about_us", (req, res) => {
  res.redirect("/about_us.html");
});

app.get("/login", async (req, res) => {
  res.redirect("/login.html");
});

app.get("/logout", async (req, res) => {
  if (!req.session.username) {
    res.status(401).json({ message: "your are not logged in" });
  } else {
    req.session.destroy((error) => {
      if (error) {
        res.status(500).json({ message: "logout failed" });
      } else {
        res.json({ message: "logout success" });
      }
    });
  }
});

app.get("/register", (req, res) => {
  res.redirect("/register.html");
});

app.get("/category", async (req, res) => {
  if (req.query.id) {
    let allResult = await pgClient.query(
      "SELECT product.name as product_name,category.name as category_name , image,unit_price,product.id FROM product join category on product.category_id = category.id WHERE product.category_id = $1 ",
      [req.query.id]
    );
    res.json({ data: allResult.rows });
  } else {
    let allResult = await pgClient.query(
      "SELECT product.name as product_name,category.name as category_name , image,unit_price,product.id  FROM product join category on product.category_id = category.id"
    );
    res.json({ data: allResult.rows });
  }
});

app.get("/product", async (req, res) => {
  if (req.query.id) {
    let queryResult = await pgClient.query(
      "SELECT product.name as product_name,image,description,brand,material,unit_price,category.name as category_name FROM product join category on product.category_id = category.id WHERE product.id = $1",
      [req.query.id]
    );
    res.json(queryResult.rows);
  } else {
    let queryResult = await pgClient.query("SELECT * FROM product ");
    res.json(queryResult.rows);
  }
});

app.get("/product_variant", async (req, res) => {
  if (req.query.id) {
    let queryResult = await pgClient.query(
      "SELECT * from product_variant WHERE product_id = $1",
      [req.query.id]
    );
    res.json({ data: queryResult.rows });
  }
});

app.get("/product/image", async (req, res) => {
  let queryResult = await pgClient.query("SELECT * FROM product ");
  res.json(queryResult.rows);
});

app.get("/username", (req, res) => {
  if (req.session.username)
    res.json({ message: "success", data: req.session.username });
  else res.status(400).json({ message: "you are not logged in" });
});

app.get("/shopping_cart", async (req, res) => {
  let result = await pgClient.query(
    "SELECT * from shopping_cart join product_variant on product_variant_id = product_variant.id JOIN product on product_variant.product_id = product.id WHERE user_id = (SELECT id from users where email = $1)",
    [req.session.email]
  );
  res.json(result.rows);
});

app.get("/addToCart", async (req, res) => {
  let result = await pgClient.query(
    `SELECT * 
    from shopping_cart 
    join product_variant on product_variant_id = product_variant.id 
    JOIN product on product_variant.product_id = product.id 
    WHERE user_id = (SELECT id from users where email = $1)`,
    [req.session.email]
  );
  res.json(result.rows);
});
//<---APP.POST------------------------------------------------------------------------------------------------------------>
app.post("/register", async (req, res) => {
  console.log(req.body.email, req.body.passwordInput1);

  if (req.body.email == undefined || req.body.email == "") {
    res.status(400).json({ message: "Email can not be null" });
  } else if (
    req.body.passwordInput1 == undefined ||
    req.body.passwordInput1 == ""
  ) {
    res.status(400).json({ message: "Password can not be null" });
  } else if (
    req.body.passwordInput2 == undefined ||
    req.body.passwordInput2 == ""
  ) {
    res.status(400).json({ message: "Password verification can not be null" });
  } else if (req.body.passwordInput1 != req.body.passwordInput2) {
    res.status(400).json({ message: "Both passwords are not the same" });
  } else {
    // check username ? duplicate
    let queryResult = await pgClient.query(
      "SELECT username from users WHERE username = $1",
      [req.body.username]
    );
    if (queryResult.rowCount != 0) {
      res.status(400).json({ message: "Username already exists" });
    } else {
      let checkEmail = await pgClient.query(
        `SELECT email FROM users WHERE email= $1`,
        [req.body.email]
      );
      if (checkEmail.rowCount != 0) {
        res.status(400).json({ message: "Email already exists" });
      } else {
        let hashed = await hashPassword(req.body.passwordInput1);
        await pgClient.query(
          "INSERT INTO users (fullname,username,email,phonenumber,password) VALUES ($1,$2,$3,$4,$5)",
          [
            req.body.fullname,
            req.body.username,
            req.body.email,
            req.body.phonenumber,
            hashed,
          ]
        );
        res.json({ message: "Register success" });
      }
    }
  }
});

app.post("/login", async (req, res) => {
  // req.body.username ,find matching row from db,extract the hashed
  // use checkPassword  compare req.body.password with hashed
  // on return true,login success
  // on return false,login failed

  let queryResult = await pgClient.query(
    "SELECT username,password from users WHERE email = $1",
    [req.body.email]
  );

  if (queryResult.rowCount != 0) {
    console.log(queryResult.rows[0].password, queryResult.rows[0].username);

    let compareResult = await checkPassword({
      plainPassword: req.body.password,
      hashedPassword: queryResult.rows[0].password,
    });

    if (compareResult) {
      console.log(req.body.email);
      req.session["email"] = req.body.email;
      req.session["username"] = queryResult.rows[0].username;
      res.json({ message: "login success" });
    } else {
      res.status(400).json({ message: "Password is incorrect" });
    }
  } else {
    res.status(400).json({ message: "Email is incorrect" });
  }
});

app.post("/addToCart", async (req, res) => {
  console.log(req.body.product_variant_id, req.session.email);
  await pgClient.query(
    `insert into shopping_cart (user_id, product_variant_id, quantity) VALUES ((SELECT id FROM users WHERE email = $1),$2,1)`,
    [req.session.email, req.body.product_variant_id]
  );
  res.json({ message: "added to shoppingCart" });
});

//<----404----------------------------------------------------------------------------------------------------------->
app.use((req: Request, res: Response) => {
  res.status(404).sendFile(resolve("public/html/404.html"));
});

//<------------------------------------------------------------------------------------------------------------------>
app.listen(port, () => {
  console.log(`Example app listening on http://localhost:${port}`);
});

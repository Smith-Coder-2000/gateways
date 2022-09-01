var express = require("express");
var bodyParser = require("body-parser");
var multer = require("multer");
var upload = multer();
var app = express();
var mysql = require("mysql");
var cors = require("cors");
var path = require("path");
const bcrypt = require("bcryptjs");
var nodemailer = require("nodemailer");
const fs = require("fs");
const { v1: uuidv1 } = require("uuid");

var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(upload.any());
app.use(express.static("public"));

var passwordValidator = require("password-validator");
var schema = new passwordValidator();

const port = 3000;
app.use(cors());
app.set("views", __dirname + "/views");
app.use("/assets", express.static(path.join(__dirname, "assets")));
var date_obj = new Date();

schema
  .is()
  .min(8)
  .is()
  .max(100)
  .has()
  .uppercase()
  .has()
  .lowercase()
  .has()
  .digits(2)
  .has()
  .not()
  .spaces()
  .is()
  .not()
  .oneOf(["Passw0rd", "Password123"]);

var connection = mysql.createConnection({
  host: "localhost",
  port: 3308,
  user: "root",
  password: "",
  database: "gateways",
});

connection.connect(function (err) {
  if (!err) console.log("database connected");
  else console.log("database not connected");
});

app.get("/", function (req, res) {
  res.send("GET request to homepage");
});

app.post("/register", jsonParser, (req, res) => {
  var Name = req.body.Name;
  var Email = req.body.Email;
  var password = req.body.password;
  var college_id = req.body.college_id;
  var ph_no = req.body.ph_no;

  console.log(Email);
  console.log(ph_no);
  if (Name && Email && password && college_id && ph_no) {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(Email)) {
      if (schema.validate(password)) {
        connection.query(
          `SELECT Email from participants where Email='${Email}'`,
          function (err, rows) {
            if (err) throw err;
            console.log(rows.length);
            if (rows.length == 1) {
              res.send("Email id already registered");
            } else {
              connection.query(
                `INSERT INTO participants VALUES ('${uuidv1()}','${Name}','${Email}','${bcrypt.hashSync(
                  password,
                  10
                )}',${college_id},'${ph_no}',${0})`,
                function (err) {
                  if (err) throw err;
                  else res.send({ response: "success" });
                }
              );
            }
          }
        );
      } else {
        res.send("enter strong password");
      }
    } else {
      res.send("Invalid email format");
    }
  } else {
    res.send({ response: "failed" });
  }
});

app.post("/login", (req, res) => {
  try {
    var email = req.body.Email;
    var pass = req.body.password;
    var count = 0;
    if (email && pass) {
      connection.query(
        `SELECT * from participants where Email='${email}'`,
        function (err, rows) {
          if (err) throw err;
          if (rows.length != 0) {
            var password_hash = rows[0]["password"];
            const verified = bcrypt.compareSync(pass, password_hash.toString());
            if (verified) {
              count = 1;
            }
          }
          if (count == 1) {
            // res.send({"encrypt":bcrypt.hashSync(pass, 10),"cust_id":id})
            res.send({ data: rows });
          } else {
            res.status(404).send("Not Found");
          }
        }
      );
    } else {
      res.send({ response: "failed" });
    }
  } catch {
    res.status(404).send("Not Found");
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

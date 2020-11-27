const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
/////////////
const https = require("https");
////////////////////
const md5 = require("md5");
////////////////
const ejs = require("ejs");
app.set('view engine', 'ejs');
app.use(express.static("public"));
///////////////////
const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://pradeep_22:panchal_22@cluster0.j1m9y.mongodb.net/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
///////////////////
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  today_list: [String],
  future_list:[{
    item:String,
    date:Date
  }]
});
const user = mongoose.model('user', userSchema);
///////////////////////////////
app.get("/", function(req, res) {
  res.render("home");
});
////////////////////////////////////////////////////
app.post("/signup", function(req, res) {
  if (req.body.susername === "" || req.body.spassword === "") {
    res.render("failure", {
      error: "username or password should'nt be empty"
    });
  } else {
    user.findOne({
      username: req.body.susername
    }, function(err, founduser) {
      if (err) console.log(err);
      else {
        if (founduser) {
          res.render("failure", {
            error: "username already exist"
          });
        } else {
          if ((req.body.spassword).length < 5) {
            res.render("failure", {
              error: "password should be more than 5 charactors"
            });
          } else {
            const newuser = new user({
              username: req.body.susername,
              password: md5(req.body.spassword)
            });
            newuser.save();
            res.render("todolist", {
              usr: newuser,
              day: fun1()
            });
          }
        }
      }
    });
  }
});
/////////////////////////////////////////////////////////
app.post("/login", function(req, res) {
  user.findOne({
    username: req.body.lusername
  }, function(err, founduser) {
    if (err) console.log(err);
    else {
      if (founduser) {
        if (founduser.password === md5(req.body.lpassword)) {
          res.render("todolist", {
            usr: founduser,
            day: fun1()
          });
        } else {
          res.render("failure", {
            error: "incorrect password"
          });
        }
      } else {
        res.render("failure", {
          error: "user is not registered"
        });
      }
    }
  });
});
//////////////////////
function sortbydate(a,b){
  var dateA=new Date(a.date).getTime();
  var dateB=new Date(b.date).getTime();
  return dateA >= dateB ? 1 : -1;
}
///////////////////////////////
app.post("/:username", function(req, res) {

    user.findOne({
    username: req.params.username
  }, function(err, founduser) {
    if (err) console.log(err);
    else {
      if(req.body.titem){founduser.today_list.push(req.body.titem);}
      if(req.body.tindex){
      founduser.today_list.splice(req.body.tindex,1);
      }
      if(req.body.fitem){
        if(new Date(req.body.dt).getTime()>(new Date().getTime())){
        founduser.future_list.push({item:req.body.fitem,date:req.body.dt});
        founduser.future_list.sort(sortbydate);}
      }
      if(req.body.findex){
        founduser.future_list.splice(req.body.findex, 1);
      }
      founduser.save();
      res.render("todolist", {
        usr: founduser,
        day: fun1()
      });
    }
  });
});
///////////////////////////////////

////////////////////////////////
function fun1() {
  var day;
  switch (new Date().getDay()) {
    case 0:
      day = "Sunday";
      break;
    case 1:
      day = "Monday";
      break;
    case 2:
      day = "Tuesday";
      break;
    case 3:
      day = "Wednesday";
      break;
    case 4:
      day = "Thursday";
      break;
    case 5:
      day = "Friday";
      break;
    case 6:
      day = "Saturday";
  }
  return day;
}
///////////////////////
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function(req, res) {
  console.log("server is running");
})

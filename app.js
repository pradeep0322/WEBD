const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const https = require("https");
app.use(bodyParser.urlencoded({
  extended: true
}));


/////////////
const fetch=require("node-fetch");
////////////////////
const md5 = require("md5");
////////////////
const ejs = require("ejs");
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
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
  today_list: [{
  item:String,
  highlight:Number,
  checked:Number
  }],
  future_list: [{
    item: String,
    date: Date
  }],
  Notes:[{
    title:String,
    disc:String
  }],
  cityName:String
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
          if ((req.body.spassword).length < 6) {
            res.render("failure", {
              error: "password should be more than 5 charactors"
            });
          } else {
            const newuser = new user({
              username: req.body.susername,
              password: md5(req.body.spassword),
              today_list:[{item:"you can highlight/delete/check this item.", highlight:0,checked:1}],
              cityName:"Delhi"
            });
            newuser.save();
            getWeather(newuser.cityName).then((data) => {
                  res.render("today", {
                    usr: newuser,
                    day: fun1(),
                    weather: data
                  });
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
          getWeather(founduser.cityName).then((data) => {
                res.render("today", {
                  usr: founduser,
                  day: fun1(),
                  weather: data
                });
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
app.post("/:username/today", function(req, res) {
    user.findOne({
    username: req.params.username
  }, function(err, founduser) {
    if (err) console.log(err);
    else {
      if(req.body.item){
        founduser.today_list.push({item:req.body.item,highlight:0,checked:0});
      }
      if(req.body.Xindex){
      founduser.today_list.splice(req.body.Xindex,1);
      }
      if(req.body.Hindex){
        var x=founduser.today_list[req.body.Hindex].highlight;
       founduser.today_list[req.body.Hindex].highlight=(x+1)%2;
      }
      if(req.body.Cindex){
        var x=founduser.today_list[req.body.Cindex].checked;
       founduser.today_list[req.body.Cindex].checked=(x+1)%2;
      }
      if(req.body.cityName){
      founduser.cityName=req.body.cityName;
      }
      founduser.save();
  getWeather(founduser.cityName).then((data) => {
        res.render("today", {
          usr: founduser,
          day: fun1(),
          weather: data
        });
  });
    }
  });
});
/////////////////////////////////////////////
app.post("/:username/upcoming", function(req, res) {
    user.findOne({
    username: req.params.username
  }, function(err, founduser) {
    if (err) console.log(err);
    else {
      if(req.body.item){
        if(new Date(req.body.date).getTime()>(new Date().getTime())){
        founduser.future_list.push({item:req.body.item,date:req.body.date});
        founduser.future_list.sort(sortbydate);}
      }
      if(req.body.Xindex){
        founduser.future_list.splice(req.body.Xindex, 1);
      }
      if(req.body.cityName){
      founduser.cityName=req.body.cityName;

      }
founduser.save();

/////////////////////////////////////////////////
  getWeather(founduser.cityName).then((data) => {
        res.render("upcoming", {
          usr: founduser,
          day: fun1(),
          weather: data
        });
  });
    }
  });
});
///////////////////////////////////////////////////

app.post("/:username/notes", function(req, res) {
    user.findOne({
    username: req.params.username
  }, function(err, founduser) {
    if (err) console.log(err);
    else {
      if(req.body.title){
        founduser.Notes.push({title:req.body.title,disc:req.body.disc});
      }
      if(req.body.Xindex){
        founduser.Notes.splice(req.body.Xindex, 1);
      }
      if(req.body.cityName){
      founduser.cityName=req.body.cityName;
      }
      founduser.save();
  getWeather(founduser.cityName).then((data) => {
        res.render("notes", {
          usr: founduser,
          day: fun1(),
          weather: data
        });
  });
    }
  });
});
/////////////////////////////////////
async function getWeather(city) {
    const weather = await fetch(
    "https://api.openweathermap.org/data/2.5/weather?q="+city+"&units=metric&appid=8a82db8d6312a6c85216829fe5dd0aa8"
    );
    let Wdata = await weather.json();
    let temp=Wdata.main.temp;
    let description=Wdata.weather[0].description;
    let humidity=Wdata.main.humidity;
    let ans="Weather is currently "+description+" with temperature "+temp+" Celcius and humidity "+humidity+ "% at ";
    return ans;
}
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

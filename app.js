const express = require("express");
const bodyParser = require("body-parser");
const https = require("https");
const ejs = require("ejs");
const mongoose = require("mongoose");
const fetch=require("node-fetch");
const md5 = require("md5");
const app = express();
const passport=require("passport");

////////////////////////////////////////////////////////////////////////////////
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(__dirname + '/public'));
mongoose.connect("mongodb+srv://pradeep_22:panchal_22@cluster0.j1m9y.mongodb.net/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  googleId: String,
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
  cityName:String,
  weatherData:String
});

const user = mongoose.model('user', userSchema);
////////////////////////////////////////////////////////////////////////////////

app.use(passport.initialize());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  user.findById(id, function(err, user) {
    done(err, user);
  });
});
const GoogleStrategy = require('passport-google-oauth20').Strategy;
passport.use(new GoogleStrategy({
    clientID: "1036886791345-5gooufjj7gd0mhge9dipp9lqglch19b9.apps.googleusercontent.com",
    clientSecret: "OXjbiMqc5xTS6-Cxaelt5rfc",
    callbackURL: "https://pradeep22-todolist.herokuapp.com/auth/google/todoApp"
      // userProfileURL:"http://www.googleapis.com/oauth2/v3/userinfo"
  },

  function(accessToken, refreshToken, profile, done) {
    // console.log(profile);
        user.findOne({
            googleId: profile.id
        }, function(err, User) {
            if (err) {
                return done(err);
            }
            if (!User) {
                User = new user({
                    username: profile.displayName,
                    googleId:profile.id,
                    cityName:"Delhi",
                    weatherData:"Weather is currently haze with temperature 19 Celcius and humidity 37% at Delhi"
                });
                User.save(function(err) {
                    if (err) console.log(err);
                    return done(err, User);
                });
            } else {
                //found user. Return
                return done(err, User);
            }
        });
    }
));
app.get('/auth/google',passport.authenticate('google', { scope: ['profile','email'] }));
app.get('/auth/google/todoApp',passport.authenticate('google', { failureRedirect: '/' }),
    function(req, res) {
            res.render("today", {
              usr:req.user,
              day: DAY()
            });
    });
////////////////////////////////////////////////////////////////////////////////
app.get("/", function(req, res) {
  res.render("home");
});
app.get("/register",function(req,res){
    res.render("register");
});

////////////////////////////////////////////////////////////////////////////////
app.post("/register", function(req, res) {
  if (req.body.username === "" || req.body.password === "") {
    res.render("failure", {
      error: "username or password should'nt be empty"
    });
  } else {
    user.findOne({
      username: req.body.username
    }, function(err, founduser) {
      if (err) console.log(err);
      else {
        if (founduser) {
          res.render("failure", {
            error: "username already exist"
          });
        } else {
          if ((req.body.password).length < 6) {
            res.render("failure", {
              error: "password should be more than 5 charactors"
            });
          } else {
            const newuser = new user({
              username: req.body.username,
              password: md5(req.body.password),
              cityName:"Delhi",
              weatherData:"Weather is currently haze with temperature 19 Celcius and humidity 37% at Delhi"
            });
            newuser.save();
                  res.render("today", {
                    usr: newuser,
                    day: DAY()
                  });
          }
        }
      }
    });
  }
});
////////////////////////////////////////////////////////////////////////////////
app.post("/login", function(req, res) {
  user.findOne({
    username: req.body.username
  }, function(err, founduser) {
    if (err) console.log(err);
    else {
      if (founduser) {
        if (founduser.password === md5(req.body.password)) {
              res.render("today", {
                  usr: founduser,
                  day: DAY()
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

////////////////////////////////////////////////////////////////////////////////
function sortbydate(a,b){
  var dateA=new Date(a.date).getTime();
  var dateB=new Date(b.date).getTime();
  return dateA >= dateB ? 1 : -1;
}
////////////////////////////////////////////////////////////////////////////////
app.post("/:username/weatherData", function(req, res) {
  user.findOne({username:req.params.username},function(err,founduser){
  if(err) console.log(err);
  else{
    if(req.body.cityName){
    founduser.cityName=req.body.cityName;
  }
    getWeather(founduser.cityName).then((data) => {
      founduser.weatherData=data;
      founduser.save();
          res.render("today", {
            usr: founduser,
            day: DAY()
          });
    });
  }
  });
});
////////////////////////////////////////////////////////////////////////////////
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
      founduser.save();
        res.render("today", {
          usr: founduser,
          day: DAY()
        });
    }
  });
});
///////////////////////////////////////////////////////////////////////////////
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
founduser.save();
        res.render("upcoming", {
          usr: founduser,
          day: DAY()
        });
    }
  });
});
////////////////////////////////////////////////////////////////////////////////
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
      founduser.save();
        res.render("notes", {
          usr: founduser,
          day: DAY()
        });
    }
  });
});
////////////////////////////////////////////////////////////////////////////////
async function getWeather(city) {
    const weather = await fetch(
    "https://api.openweathermap.org/data/2.5/weather?q="+city+"&units=metric&appid=8a82db8d6312a6c85216829fe5dd0aa8"
    );
    let Wdata = await weather.json();
    let temp=Wdata.main.temp;
    let description=Wdata.weather[0].description;
    let humidity=Wdata.main.humidity;
    let ans="Weather is currently "+description+" with temperature "+temp+" Celcius and humidity "+humidity+ "% at "+city;
    return ans;
}
////////////////////////////////////////////////////////////////////////////////
function DAY() {
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
////////////////////////////////////////////////////////////////////////////////
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function(req, res) {
  console.log("server is running");
})

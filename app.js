//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const moment = require('moment');


const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/blogDB", {useNewUrlParser: true , useUnifiedTopology: true });
mongoose.set('useCreateIndex', true);

let date = new Date();
let formatedDate = moment(date).format("DD-MM-YYYY");
console.log(formatedDate);

const postSchema = new mongoose.Schema ({
  title: String,
  content: String,
  created: String,
  username:String
});
const userSchema = new mongoose.Schema ({
  username:String,
  password:String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User" , userSchema);
const Post = new mongoose.model("Post", postSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.get("/", function(req, res){
Post.find({}, function(err,posts){
   res.render("home", {
     startingContent: homeStartingContent,
     posts: posts
     });
 });

});

app.get("/about", function(req, res){
  res.render("about", {aboutContent: aboutContent});
});

app.get("/contact", function(req, res){
  res.render("contact", {contactContent: contactContent});
});

app.get("/compose", function(req, res){
  if(req.isAuthenticated()){
  res.render("compose");
}else{
  res.redirect("/login");
}
});

app.get("/profile" , function(req , res){
  if(req.isAuthenticated()){
    Post.find({username: req.user.username}, function(err,posts){
       res.render("profile", {
         posts: posts
         });
     });
}else{
  res.redirect("/login");
}

});

app.post("/compose", function(req, res){

  const post = new Post ({
    title: req.body.postTitle,
    content: req.body.postBody,
    created: formatedDate,
    username: req.user.username
  })

  post.save(function(err){
    if(!err){
      res.redirect("/");
    }
 });

});
app.get("/post/:postId",
function(req , res){
  Post.findOne({_id: req.params.postId}, function(err,post){
   res.render("post", {
     title: post.title,
     content: post.content
   });
 });
});

app.route("/mypost/:postId")
.get(function(req , res){
  Post.findOne({_id: req.params.postId}, function(err,post){
   res.render("mypost", {
     title: post.title,
     content: post.content ,
     postId: post.id
   });
 });
})
  .post(function(req , res){
  Post.deleteOne({_id: req.params.postId}, function(err,post){
    res.redirect("/profile")
  });
});


app.route("/update/:postId")
.get(function(req , res){
      Post.findOne({_id: req.params.postId},function(err , post){
      res.render("update", {
        title: post.title,
        content: post.content,
        postId: post.id
      });
});
})
.post(function(req , res){
   Post.updateOne({_id: req.params.postId},
     {title: req.body.postTitle , content: req.body.postBody , created:formatedDate},
      function(err){
       if(!err){
         res.redirect("/profile");
       }else{
         console.log(err);
       }
   });
  });




  app.get("/logout" , function(req ,res){
  req.logout();
  res.redirect("/");
  });


app.get("/login" ,function(req , res){
  res.render("login");
});




app.get("/register" ,function(req , res){
  res.render("register");
});


  app.post("/register" , function(req , res){

     User.register({username: req.body.username} , req.body.password , function(err , user){

       if(err){
         console.log(err);
         res.redirect("/register");

       }else{
         passport.authenticate("local")(req, res, function(){
        res.redirect("/");
      });
    }
     });
});


app.post("/login", function(req , res){
   const user = new User ({
     username: req.body.username,
     passworr: req.body.password
   });
 req.login(user , function(err){
   if(err){
     console.log(err);
   }else{
    passport.authenticate("local")(req, res, function(){
    var logedInUser = req.body.username
    res.redirect("/");
    console.log(logedInUser);
 });
}
});
});







app.listen(3000, function() {
  console.log("Server started on port 3000");
});

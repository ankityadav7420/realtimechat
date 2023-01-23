
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config()
}
const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const bcrypt = require('bcrypt')
const { Server } = require("socket.io"); 
const mongoose = require('mongoose')
const passport = require("passport")
const initializePassport = require("./passport-config")
const flash = require("express-flash")
const session = require("express-session")
const methodOverride = require("method-override")


mongoose.connect('mongodb://localhost/chat', {
useNewUrlParser: true, useUnifiedTopology: true
})
mongoose.set('strictQuery', true);

initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
  )

  const users = []
  app.set('view engine', 'ejs')
  app.use(express.urlencoded({extended: false}))
  app.use(flash())
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false, // We wont resave the session variable if nothing is changed
    saveUninitialized: false
  }))
  app.use(passport.initialize()) 
  app.use(passport.session())
  app.use(methodOverride("_method"))
  app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", (data) => {
    socket.join(data);
    console.log(`User with ID: ${socket.id} joined room: ${data}`);
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

// Importing Libraie


app.get('/', async (req, res) => {
  res.render('index.ejs');
})
// login post functionality
app.post("/login", checkNotAuthenticated, passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/login",
  failureFlash: true
}))
 
//  register post functionality 
app.post("/register", checkNotAuthenticated, async (req, res) => {

  try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      users.push({
          id: Date.now().toString(), 
          name: req.body.name,
          email: req.body.email,
          password: hashedPassword,
      })
      // console.log(users); // Display newly registered in the console
      res.redirect("/login")
      
  } catch (e) {
      console.log(e);
      res.redirect("/register")
  }
})

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render("login.ejs")
})

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render("register.ejs")
})


app.delete("/logout", (req, res) => {
  req.logout(req.user, err => {
      if (err) return next(err)
      res.redirect("/")
  })
})

function checkAuthenticated(req, res, next){
  if(req.isAuthenticated()){
      return next()
  }
  res.redirect("/login")
}

function checkNotAuthenticated(req, res, next){
  if(req.isAuthenticated()){
      return res.redirect("/")
  }
  next()
}

server.listen(process.env.PORT || 3001, () => {
  console.log("SERVER RUNNING-->> Open 'localhost:3001'",process.env.PORT || 3001);
});
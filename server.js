const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
var path = require('path')


const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));


app.get("/", function(req, res){
    res.sendFile(__dirname + "/views/index.html");
})

app.get("/index.html", function(req, res){
    res.sendFile(__dirname + "/views/index.html");
})

app.get("/signup.html", function(req, res){
    res.sendFile(__dirname + "/views/signup.html");
})

app.get("/login.html", function(req, res){
    res.sendFile(__dirname + "/views/login.html");
})

app.listen(3000, function(){
    console.log("Server running on port 3000.");
})
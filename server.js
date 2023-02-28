// -- REQUIRING MODULES --
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

var loggedIn = false;
var signUpMessageOn = false;
var signupErrMessage = "";
var loginSuccessMessage = "";
var userName = "";
var userLastName = "";
var userFullName = "";
var userEmail = "";
var accountType = "";

// Connecting to MongoDB
mongoose.connect("mongodb://localhost:27017/users");


// -- MONGOOSE SCHEMAS --

const userSchema = new mongoose.Schema({
    accountType: {
        type: String,
        required: [true, "Please select the type for your account."]
    },
    firstName: 
    {
        type: String,
        required: [true, "Please check that your data entry is valid."]
    },
    lastName: 
    {
        type: String,
        required: [true, "Please check that your data entry is valid."]
    },
    email: 
    {
        type: String,
        required: [true, "Please check that the email you entered is valid."]
    },
    password: 
    {
        type: String,
        required: [true, "Please check that the password you entered respects our strong password guidelines."]
    }
});

const jobSchema = new mongoose.Schema({
    jobTitle: {
        type: String,
        required: [true, "Please enter a job title."]
    },
    company: {
        type: String,
        required: [true, "Please enter the name of your Company/Establishment"]
    },
    jobDescription: String,
    requirements: String,
    assets: String
});

const User = mongoose.model("User", userSchema);
const Job = mongoose.model("Job", jobSchema);


// -- GET --

app.get("/", function(req, res)
{
    res.render("index", {isLoggedIn : loggedIn, username : userName});
});

app.get("/index", function(req, res)
{
    res.render("index");
});

app.get("/signup", function(req, res)
{
    res.render("signup");
});

app.get("/login", function(req, res)
{
    res.render("login");
});

app.get("/signup-err", function(req, res)
{
    res.render("signup-err", {alertMessage : signupErrMessage});
});

app.get("/login-success", function(req,res)
{
    res.render("index-login-success", {loginSuccessMsg : loginSuccessMessage, isLoggedIn : loggedIn, username : userName});
});

app.get("/profile", function(req, res)
{
    console.log(accountType);
    res.render("profile", {isLoggedIn : loggedIn, username : userName, fullName : userFullName, accType : accountType, userFirstName : userName, userLastName : userLastName,  userEmail : userEmail});
});

app.get("/signout", function(req, res)
{
    loggedIn = false;
    signUpMessageOn = false;
    signupErrMessage = "";
    loginSuccessMessage = "";
    userName = "";
    userLastName = "";
    userFullName = "";
    userEmail = "";
    accountType = "";
    res.redirect("/");
});

app.get("/post-job", function(req, res){
    res.render("post-job", {isLoggedIn : loggedIn, username : userName});
});




// -- POST --

app.post("/signup", function(req, res)
{

    console.log(req.body.accountType);
    console.log(req.body.fname);
    console.log(req.body.lname);
    console.log(req.body.email);
    console.log(req.body.password);

    User.findOne({email: req.body.email}, function(err, userObj){

        //Stores the user profile in the database if the email the user entered does not already exist in the database.
        if (err || userObj === null)
        {

            if (req.body.password === req.body.confirmedPassword)
            {
                User.create({
                    accountType: req.body.accountType,
                    firstName: req.body.fname,
                    lastName: req.body.lname,
                    email: req.body.email,
                    password: req.body.password
                },
                function(err1){
                    if (err1)
                    {
                        console.log(err1);
                    }
                });
    
                console.log("Profile successfully created.");
                signUpMessageOn = true;
                loggedIn = true;
                loginSuccessMessage = "Welcome, " + req.body.fname + "!";
                res.redirect("/login");
            }

            else
            {
                signupErrMessage = "Your passwords do not match. Please try signing up again.";
                res.redirect("/signup-err");
            }

        }

        else
        {
            signUpMessageOn = false;
            signupErrMessage = "A Profile with the same email already exists. Please try again with a different email.";
            console.log("A Profile with the same email already exists.");
            res.redirect("/signup-err");
        }
    });
});

app.post("/signup-err", function(req, res)
{

    console.log(req.body.accountType);
    console.log(req.body.fname);
    console.log(req.body.lname);
    console.log(req.body.email);
    console.log(req.body.password);

    User.findOne({email: req.body.email}, function(err, userObj){

        //Stores the user profile in the database if the email the user entered does not already exist in the database.
        if (err || userObj === null)
        {

            if (req.body.password === req.body.confirmedPassword)
            {
                User.create({
                    accountType: req.body.accountType,
                    firstName: req.body.fname,
                    lastName: req.body.lname,
                    email: req.body.email,
                    password: req.body.password
                },
                function(err1){
                    if (err1)
                    {
                        console.log(err1);
                    }
                });
    
                console.log("Profile successfully created.");
                signUpMessageOn = true;
                loggedIn = true;
                loginSuccessMessage = "Welcome, " + req.body.fname + "!";
                res.redirect("/login");
            }

            else
            {
                signupErrMessage = "Your passwords do not match. Please try signing up again.";
                res.redirect("/signup-err");
            }

        }

        else
        {
            signUpMessageOn = false;
            signupErrMessage = "A Profile with the same email already exists. Please try again with a different email.";
            console.log("A Profile with the same email already exists.");
            res.redirect("/signup-err");
        }
    });
});

app.post("/login", function(req, res)
{

    console.log(req.body.email);
    console.log(req.body.password);

    User.findOne({email: req.body.email}, function(err, userObj){

        if (err || userObj === null)
        {
            console.log("The email address you entered did not match any of our user records.");
        }

        else
        {
            if (req.body.password === userObj.password)
            {
                console.log("Password correct!");

                accountType = userObj.accountType;
                accountType = accountType.toUpperCase() + " Account";

                userName = userObj.firstName;
                userLastName = userObj.lastName;
                userFullName = userObj.firstName + " " + userObj.lastName;
                userEmail = userObj.email;

                loginSuccessMessage = "Welcome back, " + userName + "!";

                loggedIn = true;
                signUpMessageOn = true;

                console.log(loggedIn);
                res.redirect("/login-success");
            }
            else
            {
                signUpMessageOn = false;
                loggedIn = false;
                console.log("The password you entered is incorrect.");
            }
        }

    })

});

app.post("/job-post-success", function(req, res){

    Job.create({
        jobTitle: req.body.title,
        company: req.body.company,
        jobDescription: req.body.description,
        requirements: req.body.requirements,
        assets: req.body.assets
    });
}); 

app.listen(3000, function()
{
    console.log("Server running on port 3000.");
});
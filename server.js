// -- REQUIRING MODULES --
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const { find } = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


// Connecting to MongoDB
main().then(console.log("Successfully connected to MongoDB Atlas.")).catch((err) => console.log(err));
async function main()
{
    mongoose.set("strictQuery", true);
    await mongoose.connect("mongodb+srv://sisahga:Jb_50055007$@cluster1.jukr83b.mongodb.net/?retryWrites=true&w=majority");
}


// VARIABLES

var loggedIn = false;
var signUpMessageOn = false;
var signupErrMessage = "";
var loginSuccessMessage = "";
var userName = "";
var userLastName = "";
var userFullName = "";
var userEmail = "";
var accountType = "";
var accountID = "";

var jobs = [];
var employerJobs = [];
var job;
var kebabCaseJobTitles = [];

var jobRouteName = "";

var truncatedJobDescription = [];



function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}


// -- MONGOOSE SCHEMAS --

const userSchema = new mongoose.Schema(
{
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

const User = mongoose.model("User", userSchema);

const jobSchema = new mongoose.Schema(
{
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
    assets: String,
    authorID: String
});

const Job = mongoose.model("Job", jobSchema);


// -- GET --

app.get("/", function(req, res)
{
    res.render("index", 
    {
        isLoggedIn : loggedIn, 
        username : userName
    });
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
    res.render("signup-err", 
        {
            alertMessage : signupErrMessage
        }
    );
});

app.get("/login-success", function(req,res)
{
    res.render("index-login-success", 
        {
            loginSuccessMsg : loginSuccessMessage, 
            isLoggedIn : loggedIn, 
            username : userName
        }
    );
});

app.get("/profile", function(req, res)
{
    console.log(accountType);
    res.render("profile", 
        {
            isLoggedIn : loggedIn, 
            username : userName,
            fullName : userFullName,
            accType : accountType,
            userFirstName : userName, 
            userLastName : userLastName,  
            userEmail : userEmail
        }
    );
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

app.get("/post-job", function(req, res)
{
    res.render("post-job", 
        {
            isLoggedIn : loggedIn, 
            username : userName
        }
    );
});

app.get("/student-jobs", function(req, res)
{
    Job.find({}, async function(err, allJobs) {
        jobs = [];
        if (err)
        {
            console.log("No jobs available.");
        }
        else
        {
            await allJobs.forEach(function(job){
                jobs.push(job);
                kebabCaseJobTitles.push(_.kebabCase(job.company + " " + job.jobTitle));
            });
        }
    });

    console.log(jobs);

    sleep(250).then(() => {
        res.render("student-jobs", 
        {
            isLoggedIn : loggedIn, 
            username: userName, 
            jobs : jobs,
            kebabTitles: kebabCaseJobTitles
        }
    );
    });
});
  
app.get("/student-jobs/:jobID", function(req, res)
{
    
    Job.findById(req.params.jobID, async function(err, foundJob)
    {
        console.log(foundJob);
        if (err)
        {
            console.log("There is an error.");
            console.log(err);
        }
        else
        {
            job = foundJob;
            console.log("Found matching job.");
        }
    });

    console.log(job);


    sleep(250).then(()=> {
        res.render("job", 
        {
            isLoggedIn: loggedIn,
            username: userName,
            job: job
        });
    });
})

app.get("/myjobs", async function(req, res)
{
    async function findAccountJobs()
    {
        Job.find({}, async function(err, allJobs) {
            employerJobs = [];
            if (err)
            {
                console.log("Employer hasn't created any jobs yet.");
            }
            else
            {
                await allJobs.forEach(function(job)
                {
                    if (job.authorID == accountID)
                    {
                        employerJobs.push(job);
                        kebabCaseJobTitles.push(_.kebabCase(job.company + " " + job.jobTitle));
                    }
                });
            }
        });

        return employerJobs;
    }

    await findAccountJobs();

    sleep(250).then(() => 
    {
        res.render("employer-jobs", 
        {
            isLoggedIn : loggedIn, 
            username : userName,
            employerJobs : employerJobs
        })
    })
}); 


// -- POST --

app.post("/signup", function(req, res)
{

    console.log(req.body.accountType);
    console.log(req.body.fname);
    console.log(req.body.lname);
    console.log(req.body.email);
    console.log(req.body.password);

    User.findOne({email: req.body.email}, function(err, userObj)
    {

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

app.post("/login", async function(req, res)
{

    console.log(req.body.email);
    console.log(req.body.password);

    try
    {
        let foundUser = await User.findOne({email: req.body.email});

        console.log(foundUser.password);
    
        if (req.body.password === foundUser.password)
        {
            console.log("Password correct!");
    
            accountType = foundUser.accountType;
            accountType = accountType.toUpperCase() + " Account";
    
            userName = foundUser.firstName;
            userLastName = foundUser.lastName;
            userFullName = foundUser.firstName + " " + foundUser.lastName;
            userEmail = foundUser.email;
            accountID = foundUser.id;
    
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

    catch (err)
    {
        console.log(err);
    }

});

app.post("/job-post-success", async function(req, res)
{

    job = await Job.create({
        jobTitle: req.body.title,
        company: req.body.company,
        jobDescription: req.body.description,
        requirements: req.body.requirements,
        assets: req.body.assets,
        authorID: accountID
    });

    jobs.push(job);

    res.redirect("/profile");
}); 

app.listen(3000, function()
{
    console.log("Server running on port 3000.");
});
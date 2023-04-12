// ********** =========== BACKEND INITIALIZATION *********** ==========
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const { find, zip } = require("lodash");
const multer = require("multer");
const path = require("path");
const fs = require('fs');
const { log } = require("console");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));



// *** =============================== MULTER ================================= ***


const storage = multer.memoryStorage({
    destination: function(req, file, cb) {
        const dir = './uploads';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir); // use the created directory for storage
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now());
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
      // Check the MIME type of the file
      if (file.mimetype.startsWith('application/pdf')) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed'));
      }
    }
});


// *** ================================ END OF MULTER ================================== ***





// Connecting to MongoDB
main().then(console.log("Successfully connected to MongoDB Atlas.")).catch((err) => console.log(err));
async function main()
{
    mongoose.set("strictQuery", true);
    await mongoose.connect("mongodb+srv://sisahga:Jb_50055007$@cluster1.jukr83b.mongodb.net/?retryWrites=true&w=majority");
}


// *** =========================== VARIABLES ============================= ***

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
var errMessage = "";
var currentUser = null;

var jobs = [];
var employerJobs = [];
var job;
var kebabCaseJobTitles = [];

var studentHasCV = true;

var job_id = "";

var applicant_jobs = [];
var user_applications = [];

var deletedJob = false;
var deletedJobId = "";


// *** =========================== END OF VARIABLES ============================= ***




// ======================= Sleep Function ========================

function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}






// ******* ========================================= MONGOOSE SCHEMAS & MODELS ===================================== ********

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
    },
    cv: {
        data: Buffer,
        contentType: String
    },
    skills: String
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

const applicationSchema = new mongoose.Schema(
{
    job_id : {type : mongoose.Schema.Types.ObjectId, ref : "Job"},
    applicant : userSchema,
    status : String
});

const Application = mongoose.model("Application", applicationSchema);


// ******* =================================== END OF MONGOOSE SCHEMAS & MODELS =============================== *********






// ******* ================================ SUGGESTING JOB POSTING TO STUDENT ================================ *******

/* --> Logic: 
        - Query all job postings for job requirements (required skills)
        - Query the skills of the logged on user and split every word from their skills into an array of words
        - Filter through every job posting job requirements and store all jobs that include any of the user's skills
        - Display below the user's profile a <div> for each job that found a match with the user's skills
*/

/* Aimee's Code */
// Function to browse student profiles and suggest a job posting

const job_requirements = [];

function suggestedJobPostings() 
{
    if (currentUser.skills === undefined) { return []; }

    else 
    {
        try 
        {
            // ==> Query the jobs in MongoDB
            Job.find({}, (err, jobs) =>
            {
                if (err) {console.log(err);}
    
                jobs.forEach(function(job) 
                {
                    job_requirements.push(job.requirements.toLowerCase());
    
                    console.log("JOB REQUIREMENTS --> " + job_requirements);
                });
            });
    
            console.log("Current User's Skills --> " + currentUser.skills);
    
            const user_skills = currentUser.skills.toLowerCase();
            const per_skill_array = user_skills.split(',');
    
            // ==> Querying the requirements to see if the user has any matches between his skills and the job requirements
            const matching_requirements = job_requirements.filter(requirement => per_skill_array.some(skill => requirement.includes(skill)));
    
    
            const matching_jobs = [];
    
            // ==> Query the jobs in MongoDB with the matching jobs for the user
            matching_requirements.forEach(function(requirement)
            {
                Job.find({requirements: requirement}, (err, job) =>
                {
                    if (err) {console.log(err);}
    
                    matching_jobs.push(job);
                });
            });
    
            return matching_jobs;
        } 
    
        catch (err) 
        {
          console.log(err);
        }
    }
}




// ******* ======================================= ==> GET ROUTES <== ===================================== *******


app.get("/", function(req, res)
{
    res.render("index", 
    {
        isLoggedIn : loggedIn, 
        username : userName,
        accType : accountType
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
            username : userName,
            accType : accountType
        }
    );
});

app.get("/profile", function(req, res)
{
    console.log("Current User ID ==> " + currentUser._id);
    console.log("User Account Type ==> " + accountType);

    const matchingJobs = suggestedJobPostings();
    console.log(matchingJobs);

    res.render("profile", 
        {
            isLoggedIn : loggedIn,
            username : userName,
            fullName : userFullName,
            accType : accountType,
            userFirstName : userName, 
            userLastName : userLastName,  
            userEmail : userEmail,
            accountID : accountID,
            user : currentUser,
            matchingJobs : matchingJobs
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
            username : userName,
            accType : accountType
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

    sleep(250).then(() => {
        res.render("student-jobs", 
        {
            isLoggedIn : loggedIn, 
            username: userName, 
            jobs : jobs,
            kebabTitles: kebabCaseJobTitles,
            accType : accountType, 
        });
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
            employerJobs : employerJobs,
            accType : accountType,
            deletedJob: deletedJob,
            deletedJobId: deletedJobId
        });
        deletedJob = false;
    });
}); 

app.get("/apply/:jobID", function(req, res)
{
    job_id = req.params.jobID.toString();

    if (!loggedIn)
    {
        res.redirect("/login");
    }

    else
    {
        Job.findOne({_id : job_id}, function(err, jobObject) 
        {
            if (err)
            {
                console.log(err);
            }
            else
            {
                console.log(jobObject);
                // thisJob = jobObject;
                console.log(jobObject.company);
                console.log(jobObject.jobTitle);
                res.render("apply-to-job", 
                {
                    isLoggedIn : loggedIn, 
                    username : userName,
                    accType : accountType,
                    job : jobObject,
                    studentHasCV : studentHasCV,
                    currentUser : currentUser
                });  
            }
        })
    }
});


// To get the list of applications of the student user.
app.get("/my-applications", async function(req, res)
{
    async function findUserApplications()
    {
        applicant_jobs = [];
        user_applications = [];

        User.findOne({_id : accountID}, (err, student) =>
        {
            if (err) {console.log(err);}

            Application.find({applicant : student}, (err, application_arr) =>
            {
                if (err) { console.log(err); }
                else
                {
                    var i = 0;
                    application_arr.forEach((application) => 
                    {
                        user_applications.push(application);
                        console.log("----- CURRENT APPLICATION -----");
                        console.log(user_applications[i]);

                        Job.findOne({_id : application.job_id}, (e, job) =>
                        {
                            var j = 0
                            if (e) { console.log(e); }
                            else
                            {
                                applicant_jobs.push(job);
                                console.log("----- CURRENT JOB -----");
                                console.log(applicant_jobs[j]);
                            }
                            j++;
                        });
                        i++;
                    });
                }
            });
        });
    }

    await findUserApplications();

    sleep(800).then(() => 
    {
        res.render("my-applications", 
        {
            isLoggedIn : loggedIn, 
            username : userName,
            accType : accountType,
            applications : user_applications,
            jobs : applicant_jobs
        });
    });
});

app.get("/applicants/:jobID", async function(req, res)
{
    var jobID = req.params.jobID;
    var candidates = [];

    async function findUserApplicants()
    {
        Application.find({job_id : jobID}, async (err, studentApplications) =>
        {
            if (err) { console.log(err); }

            else
            {
                studentApplications.forEach(function(studentApplication)
                {
                    candidates.push(studentApplication.applicant);
                });
            }

            Job.findOne({_id : jobID}, (err, job) =>
            {
                if (err) {console.log(err);}
                else
                {
                    console.log(job);
                    res.render("view-applicants", {
                        isLoggedIn : loggedIn, 
                        username : userName,
                        accType : accountType,
                        applicants : candidates,
                        job: job
                    });
                }
            });
        });
    }

    await findUserApplicants(); 

});



// ******* ======================================== END OF GET ROUTES ======================================== *******










// ******* ========================================= ==> POST ROUTES <== ====================================== *******


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
                    skills: req.body.skills,
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
            currentUser = foundUser;
    
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

app.post("/confirm-apply/:job_id", function(req, res)
{
    console.log("Account_id: " + accountID);
    var student_id = accountID;
    var jobID = req.params.job_id;
    console.log(jobID);

    User.findOne({_id : student_id}, (err, student) => 
    {
        if (err) { console.log(err); }

        else 
        {
            Application.findOne({job_id : jobID, applicant : student}, (err, application) =>
            {
                if (err) {console.log(err);}
        
                else
                {
                    if (application)
                    {
                        errMessage = "User already applied for this job.";
                        console.log(errMessage);
                        application_error = true;
                        res.redirect("/student-jobs");
                    }
                    else
                    {
                        application = Application.create(
                        {
                            job_id : jobID,
                            applicant : student
                        });
                
                        console.log("Application successfully sent.");
                
                        errMessage = "";
                        application_error = false;
                
                        res.redirect("/my-applications");
                    }

                }
            })
        }
    });

});

app.post("/select-candidate/:jobID/:applicantID", function(req, res) {
    var jobID = req.params.jobID;
    var applicant_id = req.params.applicantID;

    console.log("Job ID ==> " + jobID);
    console.log("Applicant ID ==> " + applicant_id);

    User.findOne({_id : applicant_id}, (err, user) =>
    {
        if (err) { console.log(err); }
        else
        {
            Application.findOneAndUpdate({job_id : jobID, applicant : user}, {status : "Selected"}, (err) => 
            {
                if (err) { console.log(err); }
        
                else
                {
                    console.log("Applicant's application status was successfully updated.");
                    res.redirect("/profile");
                }
            });
        }
    });
});


/* ===== Handles Employer Job Deletion ===== */
app.post("/delete-job/:job_id", function(req, res)
{
    console.log("Deleting job " + req.params.job_id);

    Job.findOneAndDelete({_id : req.params.job_id}, (err, deletedObject) => 
    {
        if (err) { console.log(err); }

        else // Need to delete all related applications to that job from the database.
        {
            console.log("Deleting all applications related to job " + deletedObject._id);

            Application.deleteMany({job_id : deletedObject._id}, (err, deletedApplications) => 
            {
                if (err) {console.log(err);}
                else
                {
                    console.log("List of deleted applications related to job " + req.params.job_id);
                    console.log(deletedApplications);
                    console.log("----- DELETION SUCCESSFULLY COMPLETED -----");
                    deletedJob = true;
                    deletedJobId = req.params.job_id;
                    res.redirect("/myjobs");
                }
            });
        }
    });
});


/* ===== CV Upload ===== */

app.post('/upload/:id', upload.single('file'), (req, res) => {

    console.log(req.file);

    try 
    {
        User.findById(req.params.id, (err, user) =>
        {
            if (err) {  console.log(err);}
            console.log("File data ==> " + req.file.buffer.toString());
            currentUser = user;
            user.cv.data = req.file.buffer;
            user.cv.contentType = req.file.mimetype;
            user.save((err) => 
            {
                if (err) 
                {
                  console.log(err);
                  res.status(500).send('Internal Server Error');
                } 
                else 
                {
                    // res.json(
                    // {
                    //     userId: user._id,
                    //     filename: req.file.originalname
                    // });
                    sleep(1500).then(function()
                    {
                        res.redirect("/profile");
                    });
                }
              });
        });
    } 
    catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/view-cv/:id', function(req, res)
{
    User.findById(req.params.id, (err, user) => {
        if (err) 
        {
          console.log(err);
          res.status(500).send('Internal Server Error');
        } 
        else 
        {
          res.contentType(user.cv.contentType);
          res.send(user.cv.data);
        }
    });
});



// ******* ======================================= END OF POST ROUTES ======================================= *******






/* ===== Listener ===== */

app.listen(3000, function()
{
    console.log("Server running on port 3000.");
});
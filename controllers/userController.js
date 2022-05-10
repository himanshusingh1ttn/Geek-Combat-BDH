const User = require('../models/userModel');


const bcrypt = require('bcrypt')

const nodemailer = require('nodemailer');
const Mail = require('nodemailer/lib/mailer');
const randomstring = require('randomstring')
const config = require('../config/config')
const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}
// for send verification Mail.
const sendVerifyMail = async (name, email, userId) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: '587',
            secure: false,
            requireTLS: true,
            auth: {
                user: config.emailUser,
                pass: config.emailPass
            }
        });
        const mailOptions = {
            from: config.emailUser,
            to: email,
            subject: 'for verification mail',
            html: '<p>Hi' + name + ',please click here to <a href="http://127.0.0.1:3000/verify?id=' + userId + '"> Verify </a> your mail.</p>'
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            }
            else {
                console.log("Mail has been sent", info.response);
            }
        })
    } catch (error) {
        console.log(error.message);
    }
}




const loadRegister = async (req, res) => {
    try {
        res.render('registration');

    } catch (err) {
        console.log(err.message)
    }

}


const insertUser = async (req, res) => {
    try {
        const spassword = await securePassword(req.body.password);
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mno,
            image: req.file.filename,
            password: spassword,
            is_admin: 0
        });
        const userData = await user.save();
        if (userData) {
            sendVerifyMail(req.body.name, req.body.email, userData._id);
            res.render('registration', { message: "Your registration done.Please verify your mail." })
        }
        else {
            res.render('registration', { message: "Your registration failed." })
        }
    }
    catch (error) {
        console.log(error.message);
    }
}
const verifyMail = async (req, res) => {
    try {
        const updatedInfo = await User.updateOne({ _id: req.query.id }, { $set: { is_verified: 1 } })
        console.log(updatedInfo);
        res.render("email-verified");

    } catch (error) {
        console.log(error.message);

    }
}

//login user method start 

const loginLoad = async (req, res) => {
    try {
        res.render('login');
    } catch (err) {
        console.log(err.message);
    }
}


const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });
        if (userData) {
            const passwordmatch = await bcrypt.compare(password, userData.password);
            if (passwordmatch) {
                if (userData.is_verified === 0) {

                    res.render('login', { message: "Please verify your mail" });
                }
                else {
                    req.session.user_id = userData._id;
                    if (userData.is_Mentor == 0) {
                        res.redirect('/home');
                    }
                    else {
                        res.redirect('/mentorHome')
                    }

                }
            }
            else {
                res.render('login', { message: "Email and password is incorrect" });
            }
        }
        else {
            res.render('login', { message: "Email and password is incorrect" });
        }
    }
    catch (err) {
        console.log(err.message);
    }
}

const loadHome = async (req, res) => {
    try {
        const userData = await User.findById({ _id: req.session.user_id })
        res.render('home', { user: userData });
    } catch (error) {
        console.log(error.message);
    }
}

const userLogout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/');

    } catch (error) {
        console.log(error.message);
    }
}


// forget password 
const forgetLoad = async (req, res) => {
    try {
        res.render('forget');
    }
    catch (error) {
        console.log(error.message);
    }
}

const forgetVerify = async (req, res) => {
    try {
        const email = req.body.email;
        const userData = await User.findOne({ email: email });
        if (userData) {

            if (userData.is_verified === 0) {
                res.render('forget', { message: "Not Verfied.Verify your mail." });
            }
            else {
                const randomString = randomstring.generate();
                const updatedData = await User.updateOne({ email: email }, { $set: { token: randomString } });
                sendResetPasswordMail(userData.name, userData.email, randomString);
                res.render('forget', { message: "Please check your mail to reset password." })
            }
        }
        else {
            res.render('forget', { message: "User Mail is incorrect" });
        }
    }
    catch (error) {
        console.log(error.message);
    }
}

//For reset password sent mail
const sendResetPasswordMail = async (name, email, token) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: '587',
            secure: false,
            requireTLS: true,
            auth: {
                user: config.emailUser,
                pass: config.emailPass
            }
        });
        const mailOptions = {
            from: config.emailUser,
            to: email,
            subject: 'For reset password',
            html: '<p>Hi' + name + ',please click here to <a href="http://127.0.0.1:3000/forget-password?token=' + token + '">Reset</a> your password.</p>'
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            }
            else {
                console.log("Mail has been sent", info.response);
            }
        })
    } catch (error) {
        console.log(error.message);
    }
}

const forgetPasswordLoad = async (req, res) => {
    try {
        const token = req.query.token;
        const tokenData = await User.findOne({ token: token })
        if (tokenData) {
            res.render('forget-password', { user_id: tokenData._id });
        }
        else {
            res.render('404', { message: "Token is invalid" });
        }
    } catch (error) {
        console.log(error.message);

    }
}

const resetPassword = async (req, res) => {
    try {
        const password = req.body.password;
        const user_id = req.body.user_id;
        const secure_password = await securePassword(password);
        const updatedData = await User.findByIdAndUpdate({ _id: user_id }, { $set: { password: secure_password, token: '' } });
        res.redirect('/');
    } catch (error) {
        console.log(error.message);
    }
}

const verificationLoad = async (req, res) => {
    try {
        res.render('verification')
    } catch (error) {
        console.log(error.message);

    }
}

const sentVerificationLink = async (req, res) => {
    try {
        const email = req.body.email;
        const userData = await User.findOne({ email: email });
        if (userData) {
            sendVerifyMail(userData.name, userData.email, userData._id);
            res.render('verification', { message: "Verification mail sent,check your mail" })
        }
        else {
            res.render('verification', { message: "Mail not valid" })
        }
    } catch (error) {
        console.log(error.message);
    }
}

//User profile edit
const editLoad = async (req, res) => {
    try {
        const id = req.query.id;
        const userData = await User.findById({ _id: id })
        if (userData) {
            res.render('edit', { user: userData });
        }
        else {
            res.redirect('/home')
        }
    } catch (error) {
        console.log(error.message);
    }
}

const updateProfile = async (req, res) => {
    try {
        if (req.file) {
            const userData = await User.findByIdAndUpdate({ _id: req.body.user_id }, { $set: { name: req.body.name, email: req.body.email, mobile: req.body.mobile, image: req.file.filename } })
            console.log(userData)
        }
        else {
            const userData = await User.findByIdAndUpdate({ _id: req.body.user_id }, { $set: { name: req.body.name, email: req.body.email, mobile: req.body.mobile } })
        }
        res.redirect('/home');
    } catch (error) {
        console.log(error.message)
    }
}


const loadMentorHome = async (req, res) => {
    try {
        const userData = await User.findById({ _id: req.session.user_id })
        res.render('mentorHome', { user: userData });
    } catch (error) {
        console.log(error.message);
    }
}


const loadCheckCourse = async (req, res) => {
    try {
        res.render('checkCourse');
    } catch (error) {
        console.log(error.message);
    }
}

const loadScheduledInterview = async (req, res) => {
    try {
        res.render('scheduledInterview');
    } catch (error) {
        console.log(error.message);
    }
}

const loadfindTrainee = async (req, res) => {
    try {
        const userData = await User.find({ is_mentor: 0, is_admin: 0 })
        res.render('findTrainee', { users : userData });
    } catch (error) {
        console.log(error.message);
    }
}

const loadAddVideo = async (req, res) => {
    try {
        res.render('addVideo');
    } catch (error) {
        console.log(error.message);
    }
}

const loadfindTraineeRes = async (req, res) => {
    try {
        const data = req.body.trainee;
        if (data.endsWith(".com")) {
            const userData = await User.find({email:{$regex: req.body.trainee},is_Mentor:0,is_admin:0});
            if (userData.length > 0) {
                res.render('findTrainee', { users: userData});
            }
        }
        const users = await User.find({ name: { $regex: req.body.trainee },is_Mentor:0,is_admin:0});
        if (users.length > 0) {
            res.render('findTrainee', { users: users});
        }
        else{
            res.render('findTrainee',{users:users});
        }
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = { loadRegister, insertUser, verifyMail, loginLoad, verifyLogin, loadHome, userLogout, forgetLoad, forgetVerify, forgetPasswordLoad, resetPassword, verificationLoad, sentVerificationLink, editLoad, updateProfile, loadMentorHome, loadCheckCourse, loadScheduledInterview, loadfindTrainee, loadAddVideo, loadfindTraineeRes };

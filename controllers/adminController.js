const User = require("../models/userModel")

const bcrypt = require('bcrypt');
const randomstring = require('randomstring')
const config = require('../config/config')
const nodemailer = require('nodemailer');
const Mail = require('nodemailer/lib/mailer');

const addUserMail = async (name, email, password, userId) => {
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
            subject: 'Admin add you and Verify your mail',
            html: '<p>Hi' + name + ',please click here to <a href="http://127.0.0.1:3000/verify?id=' + userId + '"> Verify </a> your mail.</p><br> <b>Email:</b>' + email + '<br><b>Password:</b>' + password + ''
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


const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}
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
            html: '<p>Hi' + name + ',please click here to <a href="http://127.0.0.1:3000/admin/forget-password?token=' + token + '">Reset</a> your password.</p>'
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

const loadLogin = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.log(error.message);
    }
}

const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({ email: email });
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                if (userData.is_admin === 0) {
                    res.render('login', { message: "Email and password is incorrect" });
                }
                else {
                    req.session.user_id = userData._id;
                    res.redirect('/admin/home');
                }
            }
            else {
                res.render('login', { message: "Email and password is incorrect" });
            }
        }
        else {
            res.render('login', { message: "Email and password is incorrect" });
        }
    } catch (error) {
        console.log(error.message);
    }
}

const loadDashboard = async (req, res) => {
    try {
        const userData = await User.findById({ _id: req.session.user_id });
        res.render('home', { admin: userData });
    } catch (error) {
        console.log(error.message)
    }
}

const logout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/admin')
    } catch (error) {
        console.log(error.message);
    }
}

const forgetLoad = async (req, res) => {
    try {
        res.render('forget');
    } catch (error) {
        console.log(error.message)
    }
}


const forgetVerify = async (req, res) => {
    try {
        const email = req.body.email
        const userData = await User.findOne({ email: email });
        if (userData) {
            if (userData.is_admin === 0) {
                res.render('forget', { message: 'Email is incorrect' });
            }
            else {
                const randomString = randomstring.generate();
                const updatedData = await User.updateOne({ email: email }, { $set: { token: randomString } });
                sendResetPasswordMail(userData.name, userData.email, randomString);
                res.render('forget', { message: 'Please Check your mail to reset password' })
            }
        }
        else {
            res.render('forget', { message: 'Email is incorrect' });
        }
    } catch (error) {
        console.log(error.message)
    }
}

const forgetPasswordLoad = async (req, res) => {
    try {
        const token = req.query.token;
        const tokenData = await User.findOne({ token: token });
        if (tokenData) {
            res.render('forget-password', { user_id: tokenData._id })
        }
        else {
            res.render('404', { message: "Invalid Link" })
        }
    } catch (error) {
        console.log(error.message)
    }
}

const resetPassword = async (req, res) => {
    try {
        const password = req.body.password;
        const user_id = req.body.user_id;
        const securepassword = await securePassword(password);
        const userData = await User.findByIdAndUpdate({ _id: user_id }, { $set: { password: securepassword, token: '' } })
        res.redirect('/admin')
    } catch (error) {
        console.log(error.message);
    }
}
const admindashboard = async (req, res) => {
    try {
        const usersData = await User.find({ is_admin: 0 })
        res.render('dashboard', { users: usersData });
    } catch (error) {
        console.log(error.message);
    }
}

//Add new user
const newUserLoad = async (req, res) => {
    try {
        res.render('new-user');
    } catch (error) {
        console.log(error.message);
    }
}

const addUser = async (req, res) => {
    try {
        const name = req.body.name;
        const email = req.body.email;
        const mobile = req.body.mno;
        const image = req.file.filename;
        const desig = req.body.desig;
        const yoj=req.body.yoj;
        const mentor = 0;
        if (desig == 'Mentor') {
            Mentor = 1;
        }
        const password = randomstring.generate(8);
        const spass = await securePassword(password);
        const user = new User({
            name: name, email: email, mobile: mobile, image: image, password: spass, is_admin: 0, is_Mentor: mentor,yoj:yoj
        })
        const userData = await user.save();
        if (userData) {
            addUserMail(name, email, password, userData._id);
            res.redirect('/admin/dashboard')
        }
        else {
            res.render('new-user', { message: "Something Wrong" })
        }
    } catch (error) {
        console.log(error.message)
    }
}

//edit user functionality
const editUserLoad = async (req, res) => {
    try {
        const id = req.query.id;
        const user = await User.findById({ _id: id })
        if (user) {
            res.render('edit-user', { user: user });
        }
        else {
            res.redirect('/admin/dashboard')
        }
    } catch (error) {
        console.log(error.message);
    }
}

const updateUsers = async (req, res) => {
    try {
        const userdData = await User.findByIdAndUpdate({ _id: req.body.id }, { $set: { name: req.body.name, email: req.body.email, mobile: req.body.mno, is_verified: req.body.verify } })

        res.redirect('/admin/dashboard')
    } catch (error) {
        console.log(error.message);
    }
}

const deleteUser = async (req, res) => {
    try {
        const id = req.query.id;
        await User.deleteOne({ _id: id });
        res.redirect('/admin/dashboard')
    } catch (error) {
        console.log(error.message);
    }
}

const loadInterview = async (req, res) => {
    try {
        res.render('interview');
    } catch (error) {
        console.log(error.message)
    }
}

const scheduleInterview = async (req, res) => {
    try {
        const TraineeData=await User.find({is_Mentor:0});
        const MentorData=await User.find({is_Mentor:1});
        const dateF=req.body.mydate
        console.log(dateF)
        var i=0
        var j=0
        const perTrainee=Math.floor(TraineeData.length/MentorData.length)+1
        while(j!=TraineeData.length){
            var k=0;
            while(k!=perTrainee){
                console.log(k,i,j);
                const datapush={interviewe_id:TraineeData[j]._id.toString(),interview_date:req.body.mydate}
                const userdData = await User.findByIdAndUpdate({ _id: MentorData[i]._id}, { $push: { scheduledInterview:datapush } })
                const mdata={interviewe_id:MentorData[i]._id.toString(),interview_date:req.body.mydate}
                const dData = await User.findByIdAndUpdate({ _id: TraineeData[j]._id}, { $push: { scheduledInterview:mdata } })

                j+=1;
                if(j===TraineeData.length){
                    break;
                }
                k+=1;
               
            }
            i+=1;
        }
        res.render('interview');
    } catch (error) {
        console.log(error.message)
    }
}

const loadaddVideo = async (req, res) => {
    try {
        res.render('addVideo');
    } catch (error) {
        console.log(error.message)
    }
}

const addVideo = async (req, res) => {
    try {
        const video = req.file.filename;
        const tittle = req.body.title;
        const desc = req.body.description;
        const user = req.session.user_id;
        const data = { tittle: tittle, desc: desc, video: video };
        const updatedData = await User.findOneAndUpdate({ _id: user }, { $push: { videos: data } });
        res.redirect('/admin/add-video');

    } catch (error) {
        console.log(error.message);
    }
}


const loadscheduledInterview = async (req, res) => {
    try {
        const users=[]
        const user=await User.find({_id:req.session.user_id})
        for(let i=0;i<=user.length-1;i++){
            const userId=user[i].scheduledInterview;
            for(let j=0;j<=userId.length-1;j++){
                     const interviewe=await User.find({_id:userId[j].interviewe_id})
                     console.log(interviewe)
                    const sample={name:interviewe[0].name,email:interviewe[0].email,mobile:interviewe[0].mobile,status:0,date:user[i].scheduledInterview[j].interview_date}
                    users.push(sample);
                }
        }
        res.render('scheduledInterview',{users:users});
    } catch (error) {
        console.log(error.message)
    }
}


//Searching the video 
const loadAllVideos = async (req, res) => {
    try {
        const arr = [];
        const userData = await User.find({ is_Mentor: 1 })
        
        if (userData.length > 0) {
            for (let i = 0; i <= userData.length-1; i++) {
                if (userData[i].videos.length > 0) {
                    
                    for(let j=0;j<=userData[i].videos.length-1;j++){

                        arr.push(userData[i].videos[j]);
                    }
                }
            }
        }
        res.render('searchVideo', { videoArr: arr });
    } catch (error) {
        console.log(error.message);
    }
}

const findSearchVideo=async(req,res)=>{
    try {
        const searchVid=req.body.VideoName.toLowerCase()
        const userData= await User.find({is_Mentor:1});
        const sampleArr=[];
        if(userData.length>0){
            for(let i=0;i<=userData.length-1;i++){
                if(userData[i].videos.length>0){
                    for(let j=0;j<=userData[i].videos.length-1;j++){
                        const tittleStr=userData[i].videos[j].desc.toLowerCase()
                        if(tittleStr.includes(searchVid)){
                            sampleArr.push(userData[i].videos[j]);
                        }
                    }
                }
            }
        }
        console.log()
        console.log(sampleArr);
        res.render('searchVideo', { videoArr: sampleArr});
    } catch (error) {
        console.log(error.message);
    }
}




module.exports = { loadLogin, verifyLogin, loadDashboard, logout, forgetLoad, forgetVerify, forgetPasswordLoad, resetPassword, admindashboard, newUserLoad, addUser, editUserLoad, updateUsers, deleteUser, loadInterview, loadaddVideo, loadscheduledInterview, addVideo, loadAllVideos,findSearchVideo,scheduleInterview }







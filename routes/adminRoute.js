const express=require("express");

const admin_route=express();

const session=require("express-session");
const config=require('../config/config');
admin_route.use(session({secret:config.sessionSecret}));

const bodyParser=require('body-parser');
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({extended:true}));

const auth=require('../middleware/adminAuth')

admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');

const adminController=require("../controllers/adminController")


//Upload Photo
const path=require('path')

admin_route.use(express.static('public'));

const multer=require('multer');
const storage=multer.diskStorage(
    {
        destination:function(req,file,cb){
            if(file.originalname.endsWith(".mp4")){
                cb(null,path.join(__dirname,'../public/userVideo'))
            }
            else{
                
                cb(null,path.join(__dirname,'../public/userImages'))
            }
    },
    filename:function(req,file,cb){
        const name=Date.now()+'-'+file.originalname;
        cb(null,name);
    }
});

const upload=multer({storage:storage});



admin_route.get('/',auth.isLogout,adminController.loadLogin);


admin_route.post('/',adminController.verifyLogin);

admin_route.get('/home',auth.isLogin,adminController.loadDashboard);

admin_route.get('/logout',auth.isLogin,adminController.logout);

admin_route.get('/forget',auth.isLogout,adminController.forgetLoad);
admin_route.post('/forget',adminController.forgetVerify);

admin_route.get('/forget-password',auth.isLogout,adminController.forgetPasswordLoad)
admin_route.post('/forget-password',adminController.resetPassword)


admin_route.get('/dashboard',auth.isLogin,adminController.admindashboard);

admin_route.get('/new-user',auth.isLogin,adminController.newUserLoad);
admin_route.post('/new-user',upload.single('image'),adminController.addUser);

admin_route.get('/edit-user',auth.isLogin,adminController.editUserLoad)
admin_route.post('/edit-user',adminController.updateUsers);

admin_route.get('/interview',auth.isLogin,adminController.loadInterview);
admin_route.post('/interview',adminController.scheduleInterview);


admin_route.get('/add-video',auth.isLogin,adminController.loadaddVideo);
admin_route.post('/add-video',upload.single('video'),adminController.addVideo);

admin_route.get('/scheduledInterview',auth.isLogin,adminController.loadscheduledInterview);

admin_route.get('/addFeed',auth.isLogin,adminController.loadAddFeed);
admin_route.post('/addFeed',auth.isLogin,adminController.AddFeedForm);

admin_route.get('/allVideos',auth.isLogin,adminController.loadAllVideos);
admin_route.post('/allVideos',auth.isLogin,adminController.findSearchVideo);

admin_route.get('/delete-user',adminController.deleteUser);

admin_route.get('*',function(req,res){
    res.redirect('/admin');
})

module.exports=admin_route;
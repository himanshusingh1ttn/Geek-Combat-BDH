const mongoose =require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/geekCombatdatabase");

const express = require("express");
const app = express();

//for css file
app.use(express.static(__dirname + './public'));

// for user Routes
const userRoute = require('./routes/userRoutes')

app.use('/',userRoute)

// for admin Routes
const adminRoute = require('./routes/adminRoute')

app.use('/admin',adminRoute);


app.listen(3000,function(){
 console.log("Server is Running ...");
});
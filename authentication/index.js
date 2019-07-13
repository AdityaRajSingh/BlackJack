const express = require('express');
const morgan = require('morgan');
const app = express();
const port = 5000;
const mongoose = require('mongoose');
const parser = require('body-parser');

const bcryptjs = require('bcryptjs');
const userModel = require('./models/userModel');
const jwt=require('jsonwebtoken');



mongoose.connect("mongodb+srv://adityarajsingh:<password></password>@cluster0-s8drg.mongodb.net/test?retryWrites=true&w=majority",{useNewUrlParser:true});

app.use(parser.json());
app.use(parser.urlencoded({ extended: true }));
app.use(express.static("public"));

let count = 0;
app.use(morgan('dev'));





app.get('/', function (req, res) {
    res.sendFile(__dirname+"/index-signup.html");
})


app.get('/signin', function (req, res) {
    res.sendFile(__dirname+"/index-signin.html");
})



app.post('/', function (req, res)
 {
    const newUser = new userModel({
        name: req.body.name,
        email: req.body.email,
        password: bcryptjs.hashSync(req.body.password, 10),
        amount:10000
    })


    userModel.find({ email: req.body.email })
        .exec()
        .then(users => 
            {
            if (users.length > 0) {
                res.send("User already exixts").status(400);
            }
            else {
                newUser.save();
                res.redirect("/signin");
            }
        })
});


app.post('/signin',function(req,res){

    userModel.findOne({email:req.body.email})
    .exec()
    .then(user=>{
        if(user==null)
        {
            
            
            res.send("Auth failed").status(401);
        }
        else{
           if(bcryptjs.compareSync(req.body.password,user.password))
           {
               //using synchronous function
               const token=jwt.sign(
                {
                    email:user.email,
                    _id:user._id
            },
            'qwertyu',{
                expiresIn: '12h'
            }
            );


               res.json({
                   "message":"Auth Successfull",                
                   "token":token
                   }).status(200);
               
           }
           else{
            res.send("Auth failed").status(401);
           }
        }
    })
});













app.listen(port, function () {
    console.log(`server running on port ${port}`);
})
const mongoose= require('mongoose');

const userSchema= mongoose.Schema({
    name: {
        type: String,
        required: [true, "please enter your data entry, no name specified!"]
    },
    email: {
        type: String,
        required: [true, "please enter your data entry, no email specified!"],
        unique:true
    },
    password: {
        type: String,
        required: [true, "please enter your data entry, no password specified!"]
    },
    amount: Number

});
//ye ek model hai USER ka 
module.exports=mongoose.model('User',userSchema);

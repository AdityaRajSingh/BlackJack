const users = [];

//Join User to chat
userJoin = (id,username,roomid,bidamt,type)=>
{
    const user= {id , username, roomid, bidamt,type};
    users.push(user);
    return user;
}

//Get current user
function getCurrentUser(id){
    return users.find(user=>user.id===id);
}

//User Leaves Chat
userLeaves = (id) =>
{
    const index=users.findIndex(user=> user.id === id);
    if(index!==-1)
    {
        return users.splice(index,1)[0];
    }
}

//Get Room Users
getRoomUsers=(roomid)=>
{
    return users.filter(user=> user.roomid===roomid);
}



module.exports = {
    userJoin,
    getCurrentUser,
    userLeaves,
    getRoomUsers    
} ;
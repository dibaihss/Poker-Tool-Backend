const bcrypt = require('bcrypt');
const { pool } = require('./DBConfig');

var nodemailer = require('nodemailer');
// npm i bcrypt

var transporter = nodemailer.createTransport({
  service: 'gmail',
  secure: true,
  auth: {
    user: 'souhibznkk@gmail.com',
    pass: '50Mayoa*#66'
  }
  // allow less secure app
});


var addMember = function addMember(io, memberName, email, id_member) {
  const query = "insert into member values($1 ,$2, $3)";
  const values = [id_member, memberName, email];

  // add to members
  pool
    .connect()
    .then((client) => {
      client
        .query(query, values)
        .then((res) => {})
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
  setTimeout(() => {
    getMembers(io);
  }, 200);
};
var getMembers = async function getMembers(io) {
  const results = await pool.query("select * from member");

  io.emit("getMembers", results.rows);
};

var getIdname = async function getIdname(io, myEmail) {
  console.log(myEmail);
  const query = "select name, id ,url_password from member where email = $1";
  const value = [myEmail];

  const results = await pool.query(query, value);

  io.emit("getIdname", results.rows);
};

var getmyEmail = function getmyEmail(app) {
  
  app.post('/getmyEmail' ,async (req ,res)=>{
    const query = "select name, email from member where id= $1 and url_password = $2";
  const value = [req.body.id , req.body.urlpassword];

  console.log(req.body.urlpassword)
  const results = await pool.query(query, value);

  if(results.rows.length > 0){
    res.send(results.rows)
  }else{
    res.send(false)
  }

  
  })
  
 
};

var getAdmin = function getAdmin(app){

  app.post('/getRoomAdmin' , (req , res)=>{

    pool.query('select * from room where id = $1 and admin_email = $2' ,
    [req.body.id_room , req.body.myEmail] , (err , result)=>{
      if(err){
        throw err
      }
      if(result.rows.length > 0){
        res.send(true)
      }else{
        res.send(false)
      }
    })
  })
}

var gotFriendRequest = function gotFriendRequest(
  io,
  friendname,
  id_friend,
  myid,
  myEmail
) {
  console.log(id_friend, myid, myEmail, friendname);
  const query = "insert into notifications values($1 , $2, $3 , $4)";
  const values = [id_friend, myid, friendname, myEmail];

  pool
    .connect()
    .then((client) => {
      client
        .query(query, values)
        .then((res) => {
          console.log(res.rows);
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });

  setTimeout(() => {
    getFriendRequest(io, myid);
  }, 500);
};

var getFriendRequest = async function getFriendRequest(io, myid) {
  console.log(myid, "got frinds");
  const query =
    "select id_friend ,  friend_name , friend_email from notifications where id_member = $1";
  const value = [myid];

  const result = await pool.query(query, value);

  console.log(`getNotification${myid}`);
  console.log(result.rows);
  io.emit(`getNotification${myid}`, result.rows);
};

var getFriends = async function getfriends(io, id) {
  const query =
    "select id_friend , friend_name , friend_email from member , friends_users where member.id = friends_users.id_member and friends_users.id_member = $1";
  const value = [id];
  const result = await pool.query(query, value);

  console.log(result.rows);
  io.emit(`getfriends${id}`, result.rows);
};

var acceptFriendship = function acceptFriendship(
  io,
  myid,
  myEmail,
  myName,
  id_friend,
  friend_name,
  friend_email
) {
  
  const query = "insert into friends_users values($1,$2,$3,$4)";
  const values = [myid, id_friend, friend_name, friend_email];
  const queryOFFriend = "insert into friends_users values($1,$2,$3,$4)";
  const valuesOfFriend = [id_friend, myid, myName, myEmail];
  pool
    .connect()
    .then((client) => {
      client
        .query(queryOFFriend, valuesOfFriend)
        .then((res) => {
          console.log(res.rows);
          io.emit(`getfriends${id_friend}`, res.rows);
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
  pool
    .connect()
    .then((client) => {
      client
        .query(query, values)
        .then((res) => {
          console.log(res.rows);
          io.emit(`getfriends${myid}`, res.rows);
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });

  setTimeout(() => {
    rejectFriendRequest(io, myid, id_friend);
  }, 500);
};

var rejectFriendRequest = function rejectFriendRequest(
  io,
  myid,
  id_friend
) {
  const query = "delete from notifications where id_member = $1 and id_friend = $2";
  const values = [myid, id_friend];

  pool
    .connect()
    .then((client) => {
      client
        .query(query, values)
        .then((res) => {
          console.log(res.rows);
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
    io.emit(`getNotification${id_friend}`);
};

var cancelFriendship = function cancelFriendship(io, myid, id_friend) {
  const query =
    "delete from friends_users where id_member = $1 and id_friend = $2";
  const values = [myid, id_friend];

  pool
    .connect()
    .then((client) => {
      client
        .query(query, values)
        .then((res) => {
          console.log(res.rows);
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
};

// authentification
var userRegister =  function userRegister(app){
  
  app.post('/addMemberAuth', async (req , res)=>{
    
      let {name , email , password} = req.body;
      console.log({name , email , password});
    
      let hashedPassword = await bcrypt.hash(password , 10)
      console.log(hashedPassword);




      pool.query(
        `select * from member
        where email = $1` , [email], (err , result)=>{
if(err){
  throw err
}

console.log(result.rows)


if(result.rows.length > 0){

 
  res.send(true)
}else{
  var passurl = ''
  var str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +  
        'abcdefghijklmnopqrstuvwxyz0123456789@$'; 

  for (i = 1; i <= 60; i++) { 
    var char = Math.floor(Math.random() 
                * str.length + 1); 
      
    passurl += str.charAt(char) 
} 

  pool.query( `INSERT INTO member (name, email, password, verified , url_password)
  VALUES ( $1 ,$2, $3 ,$4 , $5)
  RETURNING id, password`,
  [ name , email ,hashedPassword , false , passurl], (err , result)=>{
    if(err){
      throw err
    }
  console.log('reach here')

console.log(email)
 
var pass = ''; 

  
for (i = 1; i <= 30; i++) { 
    var char = Math.floor(Math.random() 
                * str.length + 1); 
      
    pass += str.charAt(char) 
} 

    pool.query(
      `insert into verifications values($1 , $2)
      returning email linkpassword`,
      [email , pass]
    )
  
    let mailOptions = {
      from: 'souhibznkk@gmail.com',
      to: email,
      subject: 'Verification Email',
      text: `click please on the following link to activate your account.
      
      http://localhost:3000/confirmation/${pass}`
    };
    res.send(JSON.stringify(pass))
    

    transporter
    .sendMail(mailOptions)
    .then(() => {
      console.log('A verification email has been sent!')
    })
    .catch((error) => console.error(error));


    console.log(result.rows);
  })
}
        }
      )
    })
  
}

var loginAuth = function loginAuth(app){

app.post('/login' , (req , res)=>{

  let {email, password} = req.body

  console.log(email, password);
  pool.query(
    `select * from member where email = $1`,
    [email],
    (err, results) => {
      if (err) {
        throw err;
      }
      console.log(results.rows);

      if (results.rows.length > 0) {
        const user = results.rows[0];

        if(user.verified){
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) {
            console.log(err);
          }
          if (isMatch) {
            
            res.send(true)
            console.log('password right',isMatch)
          } else {
            //password is incorrect
            res.send(isMatch)

            console.log('password wrong')
          }
        });
      }else{
        
            
        res.send({ verified: JSON.stringify('your account need to be verified!')})
      }
      } else {
        // No user
        res.send(JSON.stringify("No user with that email address"))

      }
    }
  );
})
}

var verifyEmail = function verifyEmail(app){

  app.post('/sendVerificationEmail' ,async (req, res)=>{

    console.log(req.body.email)
   
      const query = 'select linkpassword from verifications where email = $1'

    const value = [req.body.email]

const result = await pool.query(query, value)

console.log(result.rows)
    
if(result.rows.length > 0){
var mailOptions = {
      from: 'souhibznkk@gmail.com',
      to: req.body.email,
      subject: 'Verification Email',
      text: `click please on the following link to activate your account.
      
      http://localhost:3000/confirmation/${result.rows[0].linkpassword}`
    };
}else{
  var pass = ''; 
  var str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +  
          'abcdefghijklmnopqrstuvwxyz0123456789@$'; 
    
  for (i = 1; i <= 30; i++) { 
      var char = Math.floor(Math.random() 
                  * str.length + 1); 
        
      pass += str.charAt(char) 
  } 
  pool.query('insert into verifications values($1 ,$2)' , [req.body.email , pass] , 
   (err ,result)=>{
     if(err){
       throw err
     }

  
   })
     var mailOptions = {
    from: 'souhibznkk@gmail.com',
    to: req.body.email,
    subject: 'Verification Email',
    text: `click please on the following link to activate your account.
    
    http://localhost:3000/confirmation/${pass}`
  };

}
    

    transporter
    .sendMail(mailOptions)
    .then(() => {
     console.log('A verification email has been sent!')
     setTimeout(() => {
    pool.connect()
    .then((client) => {
      client
        .query('delete from verifications where email  = $1' , [req.body.email])
        .then(() => {
          
        })
        .catch((err) => {
          console.log(err);
        });
    });
    
  }, 500000);
    })
    .catch((error) => console.error(error));

  })
  
}

var sendInvitation = function sendInvitation(app){
  app.post('/sendInvitation' ,async (req ,res)=>{

    console.log(req.body)

    const query = 'select id, name from member where email = $1'

    const value = [req.body.email]

const result = await pool.query(query, value)
var mailOptions = {};

if(result.rows.length > 0){

  mailOptions = {
      from: 'souhibznkk@gmail.com',
      to: req.body.email,
      subject: 'Invitation to a room in poker app',
      text: `click please on the following link to join the room.
      
      http://localhost:8100/home/${result.rows[0].name}/${result.rows[0].id}/register/room/${req.body.room_password}/${req.body.room_name}/${req.body.id_room}`
    };

}else{
  mailOptions = {
    from: 'souhibznkk@gmail.com',
    to: req.body.email,
    subject: 'Invitation to a room in poker app',
    text: `But you dont have an account by us therefore I ask kindly to create an account and 
    then to join the room.

    
    http://localhost:8100/newaccount`
  };
}

    transporter
    .sendMail(mailOptions)
    .then(() => {
     console.log('A invitation email has been sent!')
    })
    .catch((error) => console.error(error));

  })
}

var passwordChange = function passwordChange(app){

  app.post('/passwordChange' , (req , res)=>{
console.log(req.body.email)
    pool.query(`select * from verifications where email = $1` ,
    [req.body.email] , (err ,result)=>{

if(result.rows.length > 0){
  setTimeout(() => {
    pool.connect()
    .then((client) => {
      client
        .query('delete from verifications where email  = $1' , [req.body.email])
        .then(() => {
          
        })
        .catch((err) => {
          console.log(err);
        });
    });
    
  }, 1000);
}else{
  var pass = ''; 
  var str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +  
          'abcdefghijklmnopqrstuvwxyz0123456789@$'; 
    
  for (i = 1; i <= 30; i++) { 
      var char = Math.floor(Math.random() 
                  * str.length + 1); 
        
      pass += str.charAt(char) 
  } 
  pool.query('insert into verifications values($1 , $2)',
  [req.body.email ,'pc' + pass])

   let mailOptions = {
    from: 'souhibznkk@gmail.com',
    to: req.body.email,
    subject: 'password changing poker app',
    text: `click please on the following link to change the password.
    
    http://localhost:3000/passwordtochangeconfirmation/pc${pass}`
   }

   transporter.sendMail(mailOptions)
   .then(() => {
    console.log('An email has been sent!')
   })
   .catch((err) => console.error(err));

setTimeout(() => {
  pool.connect()
  .then((client) => {
    client
      .query('delete from verifications where email  = $1' , [req.body.email])
      .then(() => {
        
      })
      .catch((err) => {
        console.log(err);
      });
  });
  
}, 600000);
}

    })
  })


}


module.exports = {
  userRegister,
  loginAuth,
  verifyEmail,
  sendInvitation,
  passwordChange,
  getAdmin,
  addMember,
  getMembers,
  getIdname,
  getmyEmail,
  gotFriendRequest,
  getFriendRequest,
  getFriends,
  acceptFriendship,
  rejectFriendRequest,
  cancelFriendship,
};

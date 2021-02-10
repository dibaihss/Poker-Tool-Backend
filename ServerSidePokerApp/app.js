const app = require("express")();
const bcrypt = require("bcrypt");

const expressLayouts = require("express-ejs-layouts");

const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origins: ["http://localhost:8100"],
  },
});
var cors = require("cors");
const bodyparser = require("body-parser");
const users = require("./users");
const rooms = require("./rooms");
const initTables = require("./tables/alltables");
const { pool } = require("./DBConfig");

app.use(expressLayouts);
app.set("layout", "./layouts/passwordchange");
app.set("view engine", "ejs");

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(cors());

app.get("/confirmation/:key", (req, res) => {
  pool.query(
    `select email from verifications where linkpassword = $1`,
    [req.params.key],
    (err, result) => {
      if (err) {
        throw err;
      }
      if (result.rows.length > 0) {
        console.log(result.rows[0].email);

        pool.connect().then((client) => {
          client
            .query("update member set verified = $1 where email = $2", [
              true,
              result.rows[0].email,
            ])
            .then(() => {
              console.log("an account has been verified!");
            })
            .catch((err) => {
              console.log(err);
            });
        });

        setTimeout(() => {
          pool.connect().then((client) => {
            client.query("delete from verifications where email = $1", [
              result.rows[0].email,
            ]);
          });
        }, 1000);
      } else {
        console.log("no account to verify with this linkpassword!");
      }
    }
  );

  console.log(req.params);
  res.send("Your account has been verified");
});

app.get("/passwordtochangeconfirmation/:key", (req, res) => {
  // res.sendFile(path.join(__dirname , 'passwordchangeform.html'))

  pool.query(
    `select email from verifications where linkpassword = $1`,
    [req.params.key],
    (err, result) => {
      if (err) {
        throw err;
      }
      if (result.rows.length > 0) {
        res.render("index", { emailaccount: result.rows[0].email });

        console.log(result.rows[0].email);
      } else {
        console.log("this linkpassword is wrong!");
      }
    }
  );

  console.log(req.params);
  // res.send('Your account has been verified');
});

app.post("/getnewpasword", async (req, res) => {
  console.log(req.body);

  // res.status(200).send(req.body);

  let hashedPassword = await bcrypt.hash(req.body.password, 10);

  pool.connect().then((client) => {
    client
      .query("update member set password = $1 where email = $2", [
        hashedPassword,
        req.body.email,
      ])
      .then(() => {
        res.send("the password has been changed!");
        console.log("the password has been changed!");
      })
      .catch((err) => {
        console.log(err);
      });
  });

  setTimeout(() => {
    pool.connect().then((client) => {
      client.query("delete from verifications where email = $1", [
        req.body.email,
      ]);
    });
  }, 1000);
});

var roomsarray = [];
initTables.initTables(pool);

users.userRegister(app);
users.loginAuth(app);
users.verifyEmail(app);
users.sendInvitation(app);
users.passwordChange(app);
users.getmyEmail(app);
users.getAdmin(app)


setTimeout(() => {
  

pool
  .connect()
  .then((client) => {
    client
      .query("select * from room")
      .then((res) => {
        console.log(res.rows);
        return (roomsarray = res.rows);
      })
      .catch((err) => {
        console.log(err);
      });
  })
  .catch((err) => {
    console.log(err);
  });
}, 200);

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  // USERS
  socket.on("addMembers", (memberName, email, id_member) => {
    users.addMember(io, memberName, email, id_member);
  });

  socket.on("getMembers", () => {
    users.getMembers(io);
  });

  // ROOMS
  socket.on("getRooms", () => {
    rooms.getRooms(io);
  });

  socket.on("addRoom", (id, roomName, roomPassword, roomAdmin, id_member) => {
    rooms.addRoom(io, id, roomName, roomPassword, roomAdmin, id_member);
  });

  // users ID
  socket.on("getIdname", (myEmail) => {
    users.getIdname(io, myEmail);
  });

  socket.on("getMembersOfRoomToEnter", (roomName) => {
    rooms.usersOfRoom(io, roomName);
  });

  socket.on("addMemberToRoom", (idRoom, idMember) => {
    rooms.addMemberToRoom(io, idRoom, idMember);
  });

  socket.on("addTask", (id_room, singleTask, taskDescription) => {
    rooms.addTask(io, id_room, singleTask, taskDescription);
  });

  for (let id of roomsarray) {
    console.log(`getTask${id.id}`);
    socket.on(`getTask${id.id}`, (id_room) => {
      rooms.getTask(io, id_room);
    });
    socket.on(`getMembersOfRoom${id.id}`, (roomName, id_room) => {
      rooms.usersOfRoom(io, roomName, id_room);
    });
    socket.on(`getVotes${id.id}`, (id_room) => {
      rooms.getVotes(io, id_room);
    });
    socket.on(`bannedUsers${id.id}`, (id_room) => {
      rooms.bannedUsers(io, id_room);
    });
  }

  socket.on("deleteTask", (id_task, id_room) => {
    rooms.deleteTask(io, id_task, id_room);
  });
  socket.on("castVote", (id_member, id_task, points) => {
    rooms.castVote(io, id_member, id_task, points);
  });

  socket.on("updataDifficulty", (difficulty, id_task) => {
    rooms.updatetaskDifficulty(io, difficulty, id_task);
  });

  socket.on("deleteVote", (id_member, id_task) => {
    rooms.deleteVote(io, id_member, id_task);
  });

  socket.on("kickSO", (blockUnblock, id_room, id_member) => {
    rooms.kickSO(io, blockUnblock, id_room, id_member);
  });

  socket.on("notification", (friendname, id_friend, myid, myEmail) => {
    users.gotFriendRequest(io, friendname, id_friend, myid, myEmail);
  });

  socket.on("deleteRoom", (id_room) => {
    rooms.deleteRoom(io, id_room);
  });

 pool.query("select * from member", (err,result)=>{
   if(err){
     throw err
   }
   for (let id of result.rows) {
    socket.on(`getNotification${id.id}`, (id) => {
      users.getFriendRequest(io, id);
    }); 
    socket.on(`getfriends${id.id}`, (id) => {
users.getFriends(io, id);
});
  }

 })
  // pool
  //   .connect()
  //   .then((client) => {
  //     client
  //       .query("select * from member")
  //       .then((res) => {
  //         for (let id of res.rows) {
  //           socket.on(`getNotification${id.id}`, (id) => {
  //             users.getFriendRequest(io, id);
  //           }); 
  //           socket.on(`getfriends${id.id}`, (id) => {
  //       users.getFriends(io, id);
  //     });
  //         }

  //         console.log(res.rows);
  //       })
  //       .catch((err) => {
  //         console.log(err);
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //   });

  socket.on(
    "acceptFriendship",
    (myid, myEmail, myName, id_friend, friend_name, friend_email) => {
      users.acceptFriendship(
        io,
        myid,
        myEmail,
        myName,
        id_friend,
        friend_name,
        friend_email
      );
    }
  );

  socket.on("rejectFriendRequest", (myid, id_friend) => {
    users.rejectFriendRequest(io, myid, id_friend);
  });

  socket.on("cancelFriendship", (myid, id_friend) => {
    users.cancelFriendship(io, myid, id_friend);
  });
});

///////////////////////////////////////////////////////////////////////////////
http.listen(3000, () => {
  console.log("listening on *:3000");
});

const { pool } = require("./DBConfig");

var getRooms = async function getRooms(io) {
  console.log("called");

  const results = await pool.query("select * from room");
  io.emit("getRooms", results.rows);
};

var addRoom = async function addRoom(
  io,
  id_room,
  roomName,
  roomPassword,
  roomAdmin,
  id_member
) {
  const queryMember_Room = "insert into member_room values($1 , $2 , $3 ,$4)";
  const valuesMember_Room = [id_member, id_room, false, false];

  const query = "insert into room values($1,$2,$3,$4)";
  const values = [id_room, roomName, roomPassword, roomAdmin];

  pool
    .connect()
    .then((client) => {
      client
        .query(query, values)
        .then((res) => {})
        .catch((err) => {
          console.log(err);
        });
      client
        .query(queryMember_Room, valuesMember_Room)
        .then((res) => {})
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log("mybe no room there2", err);
    });
};

var usersOfRoom = async function usersOfRoom(io, roomName, id_room) {
  console.log(roomName);
  const value = [roomName];
  const result = await pool.query(
    "select  member.id , name , email , kicked , friend , member_room.id_room  from room , member , member_room where member.id = member_room.id_member and room.id = member_room.id_room and label = $1",
    value
  );

  io.emit(`getMembersOfRoom${id_room}`, result.rows);
  io.emit("getMembersOfRoomToEnter", result.rows);
};

var kickSO = function kickSO(io, blockUnblock, id_room, id_member) {
  console.log(blockUnblock, id_room, id_member);
  const query =
    "update member_room set kicked = $1 where id_room = $2 and id_member = $3";
  const value = [blockUnblock, id_room, id_member];

  pool.connect().then((client) => {
    client
      .query(query, value)
      .then(() => {
        console.log("a user has been kicked");
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

var bannedUsers = async function bannedUsers(io, id_room) {
  const query =
    "select id_member , kicked from member_room where id_room = $1 and kicked = true";
  const value = [id_room];

  const res = await pool.query(query, value);
  console.log(res.rows);
  io.emit(`bannedUsers${id_room}`, res.rows);
};

var addMemberToRoom = function addMemberToRoom(io, idRoom, idMember) {
  console.log(idRoom, idMember);
  const queryMember_Room = "insert into member_room values($1 , $2 ,$3 ,$4)";
  const valuesMember_Room = [idMember, idRoom, false, false];

  pool.connect().then((client) => {
    client
      .query(queryMember_Room, valuesMember_Room)
      .then((res) => {
        console.log(res.rows);
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

var addTask = function addTask(io, id_room, singleTask, taskDescription) {
  const query =
    "insert into task(id_room, task, description) values($1, $2, $3)";
  const values = [id_room, singleTask, taskDescription];

  pool.connect().then((client) => {
    client
      .query(query, values)
      .then(() => {
        console.log("Task added");
      })
      .catch((err) => {
        console.log("add task", err);
      });
  });
  setTimeout(() => {
    getTask(io, id_room);
    // getAllTasks(io, pool);
  }, 200);
};

var getTask = async function getTask(io, id_room) {
  console.log("called get task");
  const query = "select id, task , description from task where id_room = $1";
  const value = [id_room];
  const result = await pool.query(query, value);

  console.log(result.rows);
  io.emit(`getTask${id_room}`, result.rows);
};

var deleteTask = function deleteTask(io, id_task, id_room) {
  const query = "delete from task where id = $1";
  const value = [id_task];

  pool.connect().then((client) => {
    client
      .query(query, value)
      .then(() => {
        console.log("a task has been deleted");
      })
      .catch((err) => {
        console.log(err);
      });
  });
  setTimeout(() => {
    getTask(io, id_room);
    // getAllTasks(io, pool);
  }, 200);
};

var updatetaskDifficulty = function updatetaskDifficulty(
  io,
  difficulty,
  id_task
) {
  const query =
    "update task set difficulty_level = $1 , difficulty_color = $2 where id = $3";
  const values = [
    difficulty.difficultyLevel,
    difficulty.difficultyColor,
    id_task,
  ];

  pool.connect().then((client) => {
    client
      .query(query, values)
      .then(() => {
        console.log("a vote is updated");
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

var castVote = function castVote(io, id_member, id_task, points) {
  const query = "insert into member_task values($1,$2,$3)";
  const value = [id_member, id_task, points];

  pool.connect().then((client) => {
    client
      .query(query, value)
      .then(() => {
        console.log("a vote is cast");
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

var getVotes = async function getVotes(io, id_room) {
  const query =
    "select member_task.id_task , member.id , member.name, task.task , member_task.given_points from task , member , member_task where member_task.id_member = member.id and task.id = member_task.id_task and id_room = $1";
  const value = [id_room];

  const result = await pool.query(query, value);

  console.log(result.rows);
  io.emit(`getVotes${id_room}`, result.rows);
};

var deleteVote = function deleteVote(io, id_member, id_task) {
  const query = "delete from member_task where id_member = $1 and id_task = $2";
  const values = [id_member, id_task];

  pool.connect().then((client) => {
    client
      .query(query, values)
      .then(() => {
        console.log("a task is deleted");
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

var deleteRoom = function deleteRoom(io, id_room) {
  const query = "delete from room where id = $1";
  const value = [id_room];

  pool.connect().then((client) => {
    client
      .query(query, value)
      .then(() => {
        console.log("a room is deleted");
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

module.exports = {
  getRooms,
  addRoom,
  usersOfRoom,
  addMemberToRoom,
  addTask,
  getTask,
  deleteTask,
  castVote,
  getVotes,
  updatetaskDifficulty,
  deleteVote,
  kickSO,
  bannedUsers,
  deleteRoom,
};

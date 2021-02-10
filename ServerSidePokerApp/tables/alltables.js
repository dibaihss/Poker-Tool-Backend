var initTables = function initTables(pool) {
  var tables = [
    {
      Table:
        "create table if not exists member(id serial primary key, name varchar (40) not null, email varchar (80) unique not null, password varchar(300), verified boolean , url_password varchar(60)) ",
    },
    {
      Table:
        "create table if not exists room(id serial not null primary key, label varchar (50) unique not null , password varchar(50) not null, admin_email VARCHAR ( 255 ) NOT NULL)",
    },
    {
      Table:
        "create table if not exists task(id serial primary key, id_room integer, task varchar (50) not null , description varchar(400) , difficulty_level numeric(111,11), difficulty_color varchar(7))",
    },
    {
      Table:
        "create table if not exists member_room(id_member integer not null, id_room integer not null ,  kicked boolean , friend boolean)",
    },
    {
      Table:
        "create table if not exists member_task(id_member integer not null, id_task integer not null, given_points integer not null)",
    },
    ,
    {
      Table:
        "create table if not exists friends_users(id_member integer not null , id_friend integer not null , friend_name varchar(40), friend_email varchar(90) not null)",
    },
    {
      Table:
        "create table if not exists notifications(id_member integer , id_friend integer , friend_name varchar(40), friend_email varchar(90)) ",
    },
    {
      Table:
        "create table if not exists verifications(email varchar(90) not null , linkpassword varchar(32) not null) ",
    }
  ];
  var ms = 100;

  for (let table of tables) {
    ms += 100;
    console.log(ms);
    setTimeout(() => {
      pool
        .connect()
        .then((client) => {
          client
            .query(table.Table)
            .then((res) => {
              console.log(res.rows);
            })
            .catch((err) => {
              console.log(err);
            });
        })
        .catch((err) => {
          console.log("mybe no room there2", err);
        });
    }, ms);
  }
};

module.exports = { initTables };


//import of external packages to be used
const   url = require('url'),
        http = require('http'),
        path = require('path'),
        bodyParser = require('body-parser'),
        ejs = require('ejs'),
        sqlstring = require('sqlstring'),
        electron = require('electron'),
        sqlite = require('sqlite3').verbose(),
        fs = require('fs'),
        util = require('util');
//initiating server info
const   express = require('express'),
        serv = express(),
        port = 8080;
//setting up the POST request parser
serv.use(bodyParser.urlencoded(({extended:false})));
serv.use(bodyParser.json());
//changing the view engine to render EJS
serv.set('view engine', 'ejs');

//Squirrel SetupEvents
const setupEvents = require(__dirname + "/setupEvents.js");

if(setupEvents.handleSquirrelEvent()) {

    return;

}

//A simple function to get todays date in the proper format
const getDate = () => {

    let     date = new Date(),
            day = ("0" + date.getDate()).slice(-2),
            month = ("0" + (date.getMonth() + 1)).slice(-2),
            year = date.getFullYear();

    return year + "-" + month + "-" + day;

}
//gets the number of day differences between 2 dates
const dateDiff = (origin, current) => {
    //converts string to date objects
    const   originDate = new Date(origin),
            currentDate = new Date(current),

            originTime = originDate.getTime(),
            currentTime = currentDate.getTime(),
            //gets the difference between times and then converts it to days
            diffTime = currentTime - originTime,
            diffDay = Math.round(diffTime / (1000 * 60 * 60 * 24));

    console.log(originDate);
    console.log(currentDate);
    console.log(diffDay);
    //if the day is after last track returns it
    if(diffDay >= 0) {
        return diffDay.toString();
    }
    else {
        return "n/a";
    }

}
//simple function to clean sql query
const sqlEscape = (query) => {
    //changes how apostrphe escaping is handled as SQL does differently
    let     escapedQuery = query.replace("\'", "''"),
            cleansedQuery = sqlstring.escape(escapedQuery);
    //cleans up after the sql escape gets a bit to OCD in its cleanse
    cleansedQuery = cleansedQuery.replace(/\\/g, "");
    console.log(cleansedQuery);

    return cleansedQuery;

}
//ensuring the database file exists in the user directory
let dbPath = electron.app.getPath('userData') + "/NOTES.db";
let db;
//async function to open database and ensure tables is created
function openDB() {
  return new Promise((resolve, reject) => {
    //pomisifies the database creation and writeFile function
    const writeFile = util.promisify(fs.writeFile),
          Database = (dbPath, sqlType) => {
            return new Promise((res, rej) => {
              //creates the database
              let initializedDB = new sqlite.Database(dbPath, sqlType, (err) => {
                //if errored then rejects promise
                if(err) {
                  console.log("failed to intialize databse connection");
                  rej(err);
                }
                //if succeeds returns database
                res(initializedDB);
              });
            });
          }

    //attempts to write a file if does not exist
    writeFile(dbPath, "", { flag : 'wx' })
      //logs the error, it should just generally be "file exists"
      .catch(response => {
        console.log(response);
      })
      //once file is confirmed created proceeds
      .then (response => {
        console.log("file is there");
        //opens a connection to the data base as read write
        db = Database(dbPath, sqlite.OPEN_READWRITE)
          //if connection fails logs and throws error
          .catch(err => {
            console.log(err);
            throw err;
          })
          //once connection succeeds runs queries to ensure tables exist properly
          .then(result => {
            //sets up an async function for all queries
            const query = (queryString, values) => {
              return new Promise((res, rej) => {
                result.all(queryString, values, (err, queres) => {
                  //if query fails and rejects the promise
                  if(err) {
                    console.log(err);
                    rej(err);
                  }
                  //if query succeeds resolves to the query response
                  res(queres);
                })
              })
            }
            //creates the notes table if its not there
            query("create table  if not exists notes(id INTEGER PRIMARY KEY AUTOINCREMENT, note_id TEXT, note TEXT, date TEXT);", [])
              .catch(err => {
                console.log(err);
              })
              .then(res => {
                console.log("notes table exists");
              });
            //creates the trackers table if its not there
            query("create table if not exists trackers(id INTEGER PRIMARY KEY, dataWipe TEXT, detractor TEXT, nps TEXT);", [])
              .catch(err => {
                console.log(err);
              })
              .then(res => {
                console.log("trackers table exists");
                //once we know trackers exists ensures the lines are there
                query("select * from trackers where id = 1;", [])
                  //if something goes wrong logs and throws error
                  .catch(err => {
                    console.log(err);
                    throw err;
                  })
                  //if the line does not exists initializes default values
                  .then (res => {
                    if(res.length === 0) {
                      query("insert into trackers(id, dataWipe, detractor, nps) values (1, '2100-01-01', '2100-01-01', '2100-01-01')", [])
                        //logs and throws if error
                        .catch(err => {
                          console.log(err);
                          throw err;
                        })
                        //notes success if succeds
                        .then(res => {
                          console.log("made missing tracker row");
                        });
                    }
                    console.log("tracker table good");
                  });
                  //once tables exist resolves the database to the original caller
                  resolve(result);
                });

          });

      });

  });

}

//serves the local scripts, images and css
serv.use(express.static(__dirname + "/public"));
//a route to reset a tracked value
serv.get('/:date/reset', (req, res) => {

    console.log("got a reset request for " + req.query.stat);
    //pulls relevant information from req
    const   changeDate = req.params.date,
            changeType = req.query.stat;

    console.log(changeDate);
    console.log("got a reset request for " + changeType);
    //if not a date redirects to todays date
    if(!changeDate.match('[0-9]{4}-[0-9]{2}-[0-9]{2}')) {

        console.log("bad reset request, not a date redirecting to todays date");
        res.redirect("/" + getDate());

    }
    //if not a valid change type does nothing
    if(changeType != "dataWipe" || changeType != "detractor" || changeType != "nps") {

        console.log("bad reset request, not a resettable value");
        res.redirect("/" + changeDate);

    }
    //updates the stat with the current date
    db.all("update trackers set " + changeType + " = '" + changeDate + "' where id = 1;", (err, result) => {

        if(err) {

            console.log(err);
            throw err;

        }



    });
    //redirects to rerender page
    res.redirect("/" + changeDate);

});
//main route anytime there is a date in the path
serv.route('/[0-9]{4}-[0-9]{2}-[0-9]{2}')

    .get((req, res) => {
        //if there is something that is in the get request moves it to the path
        if(req.query.date !== undefined) {

            res.redirect('/' + req.query.date);

        }
        //else sets up the data to be rendered in main.ejs
        else {
            //extracts the date of the request from the path
            date = (req.path).slice(1,req.path.length);
            //primary query to get the days notes
            db.all("select id, note_id, note from notes where date = '" + date + "';", (err, rows) => {

                if(err) {

                    console.log(err);
                    throw err;

                }
                //secondary query to get the tracked stats
                db.all("select dataWipe, detractor, nps from trackers where id = 1;", (err, trackers) => {
                    //creates the set of tracked stats
                    let trackedSet = {

                        dataWipe: dateDiff(trackers[0].dataWipe, date),
                        detractor: dateDiff(trackers[0].detractor, date),
                        nps: dateDiff(trackers[0].nps, date)

                    },
                    //creates the data JSON object with the tracked set, date and data
                    data = {

                                    date: date,
                                    data: rows,

                                    trackers: trackedSet

                                }

                    console.log(data);
                    //renders teh page
                    res.render(__dirname + '/views/main.ejs', data);

                })

            });

            console.log("rendered new Page");

        }

    })
    //post function for pushing new entries to server
    .post((req, res) => {
        //verifies the entries in log
        console.log(req.body.uniqueID);
        console.log(req.body.identifier);
        console.log(req.body.notes);
        console.log(req.body.changeType);
        //pulls all the data out to be used later
        let     uniqueid = req.body.uniqueID;
                date = (req.path).slice(1, req.path.length),
                changeType = req.body.changeType,
                id = req.body.identifier.toUpperCase(),
                notes = req.body.notes;
        //initializes the query variable to store what kind of query it will be
        let     sqlQuery;
        //sets the query to an insert
        if(changeType === "add") {

            sqlQuery = "insert into notes (date, note_id, note) values ('" + date + "', " + sqlEscape(id) + ", " + sqlEscape(notes) + ")";

            console.log("Built insert query");
            console.log(sqlQuery);

        }
        //sets the query to update the notes of one of the entries
        else if(changeType === "edit") {

            sqlQuery = "update notes set note = " + sqlEscape(notes) + " where date = '" + date + "' and id = " + sqlEscape(uniqueid);

            console.log("Built update query");
            console.log(sqlQuery);

        }
        //sets the query to delete the specified entry
        else if(changeType === "delete") {

            sqlQuery = "delete from notes where date = '" + date + "' and id = " + sqlEscape(uniqueid);

            console.log("Built delete query");
            console.log(sqlQuery);

        }
        /*
        fall through if by some stroke of witchery they manage to not make
        it into one of the proper if streams
        */
        else {

            console.log("Got a bad post request, skipping query and rerendering page");
            res.redirect(req.path);

        }
        //runs the query defined earlier
        db.run(sqlQuery, [], (err, res) => {

            if(err) {

                console.log(err);
                throw err;

            }

            console.log("query completed");

        });

        console.log("Query performed rerendering page");

        res.redirect(req.path);

    })

/*
this will be the default connection when people first connect to server
gets todays date in the correct format and redirects to the respective page
*/
serv.get('/', (req, res) => {
    //fall back for when the root is empty
    console.log("Got root request rendering" + '/' + getDate());
    //temp SQL query that resets tracked stats on root load
    //db.all("update trackers set dataWipe = '2100-01-01', detractor = '2100-01-01', nps = '2100-01-01' where id = 1;");

    res.redirect('/' + getDate());

})
//anytime a different path is put in just redirects to todays date
serv.all("/*", (req, res) => {

    console.log("Got a bad request defaulting to todays date, rendering todays date");

    res.redirect('/' + getDate());

})
//ensures the server listen is referenced so the port can be closed on app close
const openPort = serv.listen(port);

/*
Now we get into the desktop app initializations
*/

const {app, BrowserWindow} = electron;
//initializes the windows variable globally for use
let win;

async function createWindow() {
    //opens the window and loads the root URL
    win = new BrowserWindow({width: 1300, height: 1100, icon: __dirname + "/public/Geek.ico"});
    //loads the page
    win.loadURL("http://localhost:8080/");
    console.log("Window created, page loaded")
    //when the window is closed dereferences the variable and closes everything
    win.on('close', () => {
        //drops memory of window
        win = null;
        //closes server`
        openPort.close();
        console.log("Server port closed")
        //closes DB
        db.close();
        console.log("DB connection close");
        //fully quits app
        app.quit();
        console.log("Application successfully quit");

    });

}

//when the app is ready and willing creates the window and connects to server
app.on('ready', async () => {
  //awaits database initialization
  db = await openDB();
  //once database opens and is created opens the app
  createWindow();
});

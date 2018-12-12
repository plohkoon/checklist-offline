
//import of external packages to be used
const   url = require('url'),
        http = require('http'),
        path = require('path'),
        bodyParser = require('body-parser'),
        ejs = require('ejs'),
        sql = require('sql'),
        mysql = require('mysql'),
        sqlstring = require('sqlstring'),
        electron = require('electron'),
        sqlite = require('sqlite3').verbose();
//initiating server info
const   express = require('express'),
        serv = express(),
        port = 8080;
//setting up the POST request parser
serv.use(bodyParser.urlencoded(({extended:false})));
serv.use(bodyParser.json());
//changing the view engine to render EJS
serv.set('view engine', 'ejs');



/*
old mysql connections
const con = mysql.createConnection({

                host: "localhost",
                user: "notesApp",
                password: "1234"

            });

con.connect(function(err) {

    if(err) throw err;
    console.log("connection successful");

});
*/

const getDate = () => {

    let     date = new Date(),
            day = ("0" + date.getDate()).slice(-2),
            month = ("0" + (date.getMonth() + 1)).slice(-2),
            year = date.getFullYear();

    return year + "-" + month + "-" + day;

}
//opens a connection to the data base as read write
const db = new sqlite.Database(__dirname + "/NOTES.db", sqlite.OPEN_READWRITE, (err) => {

    if(err) {

        console.log(err);
        throw err;

    }

    console.log("connection successful");

})
//a query that will ensure the database to be used exists
db.all("select name from sqlite_master where type = 'table' and name = 'notes'", [], (err, res) => {

    if(err) {

        console.log(err);
        throw err;

    }
    //if nothing is returned from the query "notes" does not exist
    if(res.length === 0) {
        //sets the query to create the table
        let sqlquery = "create table notes (id INTEGER PRIMARY KEY AUTOINCREMENT, note_id TEXT, note TEXT, date Text);";
        //executes the table creation
        db.all(sqlquery, [], (err, res) => {

            if(err) {

                console.log(err);
                throw err;

            }

            console.log("database created");

        })

    }

    console.log("Database exists");

});
//serves the local scripts, images and css
serv.use(express.static(__dirname + "/public"));

//main route anytime there is a date in the path
serv.route('/[0-9]{4}-[0-9]{2}-[0-9]{2}')

    .get((req, res) => {
        //if there is something that is in the get request moves it to the path
        if(req.query.date !== undefined) {

            res.redirect('/' + req.query.date);

        }
        //else sets up the data to be rendered in main.ejs
        else {

            date = (req.path).slice(1,req.path.length);

            db.all("select id, note_id, note from notes where date = " + sqlstring.escape(date) + ";", (err, rows) => {

                if(err) {

                    console.log(err);
                    throw err;

                }

                let data = {

                                date: date,

                                data: rows

                            }

                console.log(data);

                res.render(__dirname + '/views/main.ejs', data);

            });

            /*
            old mysql code
            con.query("select id, note_id, note from NOTES.notes where date=\"" + date + "\"", function(err, result) {

                if(err) throw err;

                let data = {

                                date: date,

                                data: result

                            };

                console.log(data);

                res.render('main.ejs', data);

            });*/
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

            sqlQuery = "insert into notes (date, note_id, note) values (\"" + date + "\", " + sqlstring.escape(id) + ", " + sqlstring.escape(notes) + ")";

            console.log(sqlQuery);

            /*old mysql code
            old mysql code
            con.query(sqlQuery, function(err, result) {

                console.log(result);

                if(err) throw err;

            });
            */

        }
        //sets the query to update the notes of one of the entries
        else if(changeType === "edit") {

            sqlQuery = "update notes set note = " + sqlstring.escape(notes) + " where date = \"" + date + "\" and id = " + sqlstring.escape(uniqueid);

            console.log(sqlQuery);

            /*
            old mysql code
            con.query(sqlQuery, function(err, result) {

                console.log(result);

                if(err) throw err;

            });*/

        }
        //sets the query to delete the specified entry
        else if(changeType === "delete") {

            sqlQuery = "delete from notes where date = \"" + date + "\" and id = " + sqlstring.escape(uniqueid);

            console.log(sqlQuery);

            /*
            old mysql code
            con.query(sqlQuery, function(err, result) {

                console.log(result);

                if(err) throw err;

            });*/

        }
        /*
        fall through if by some stroke of witchery they manage to not make
        it into one of the proper if streams
        */
        else {

            res.redirect(req.path);

        }

        db.all(sqlQuery, [], (err, rees) => {

            if(err) {

                console.log(err);
                throw err;

            }

        });

        res.redirect(req.path);

    })

/*
this will be the default connection when people first connect to server
gets todays date in the correct format and redirects to the respective page
*/
serv.get('/', (req, res) => {
    //fall back for when the root is empty
    console.log('/' + getDate())

    res.redirect('/' + getDate());

})
//anytime a different path is put in just redirects to todays date
serv.get("/*", (req, res) => {

    res.redirect('/' + getDate());

})

const openPort = serv.listen(port);

/*
Now we get into the desktop app initializations
*/

const {app, BrowserWindow} = electron;
//initializes the windows variable globally for use
let win;

const createWindow = () => {
    //opens the window and loads the root URL
    win = new BrowserWindow({width: 1300, height: 1100, icon: __dirname + "/public/Geek.ico"});

    win.loadURL("http://localhost:8080/");
    //when the window is closed dereferences the variable and closes everything
    win.on('close', () => {

        win = null;

        openPort.close();

        console.log("Server port closed")

        db.close();

        console.log("DB connection close");

        app.quit();

        console.log("Application successfully quit");

    });

}

//when the app is ready and willing creates the window and connects to server
app.on('ready', createWindow);

//terminates the program and DB connections when the window is closed
/*app.on('all-windows-closed', () => {

    win = null;

    openPort.close();

    console.log("Server port closed")

    db.close();

    console.log("DB connection close");

    app.quit();

    console.log("Application successfully quit");

});*/

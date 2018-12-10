
//import of external packages to be used
const   url = require('url'),
        http = require('http'),
        path = require('path'),
        bodyParser = require('body-parser'),
        ejs = require('ejs'),
        sql = require('sql'),
        mysql = require('mysql'),
        sqlstring = require('sqlstring'),
        electron = require('electron');
//initiating server info
const   express = require('express'),
        serv = express(),
        port = 8080;
//setting up the POST request parser
serv.use(bodyParser.urlencoded(({extended:false})));
serv.use(bodyParser.json());
//changing the view engine to render EJS
serv.set('view engine', 'ejs');



const con = mysql.createConnection({

                host: "localhost",
                user: "notesApp",
                password: "1234"

            });

con.connect(function(err) {

    if(err) throw err;
    console.log("connection successful");

})

const getDate = function() {

    let     date = new Date(),
            day = ("0" + date.getDate()).slice(-2),
            month = ("0" + (date.getMonth() + 1)).slice(-2),
            year = date.getFullYear();

    return year + "-" + month + "-" + day;

}

serv.use(express.static("public"));

//main route anytime there is a date in the path
serv.route('/[0-9]{4}-[0-9]{2}-[0-9]{2}')

    .get(function(req, res) {
        //if there is something that is in the get request moves it to the path
        if(req.query.date !== undefined) {

            res.redirect('/' + req.query.date);

        }
        //else sets up the data to be rendered in main.ejs
        else {

            date = (req.path).slice(1,req.path.length)

            con.query("select id, note_id, note from NOTES.notes where date=\"" + date + "\"", function(err, result) {

                if(err) throw err;

                let data = {

                                date: date,

                                data: result

                            };

                console.log(data);

                res.render('main.ejs', data);

            })
        }

    })
    //post function for pushing new entries to server
    .post(function(req, res) {
        //verifies the entries in log
        console.log(req.body.uniqueID);
        console.log(req.body.identifier);
        console.log(req.body.notes);
        console.log(req.body.changeType);

        let     uniqueid = req.body.uniqueID;
                date = (req.path).slice(1, req.path.length),
                changeType = req.body.changeType,
                id = req.body.identifier.toUpperCase(),
                notes = req.body.notes;

        if(changeType === "add") {

            let sqlQuery = "insert into NOTES.notes (date, note_id, note) values (\"" + date + "\", " + sqlstring.escape(id) + ", " + sqlstring.escape(notes) + ")";

            console.log(sqlQuery);

            con.query(sqlQuery, function(err, result) {

                console.log(result);

                if(err) throw err;

            });

        }
        else if(changeType === "edit") {

            let sqlQuery = "update NOTES.notes set note = " + sqlstring.escape(notes) + " where date = \"" + date + "\" and id = " + sqlstring.escape(uniqueid);

            console.log(sqlQuery);

            con.query(sqlQuery, function(err, result) {

                console.log(result);

                if(err) throw err;

            });

        }
        else if(changeType === "delete") {

            let sqlQuery = "delete from NOTES.notes where date = \"" + date + "\" and id = " + sqlstring.escape(uniqueid);

            console.log(sqlQuery);

            con.query(sqlQuery, function(err, result) {

                console.log(result);

                if(err) throw err;

            });

        }

        res.redirect(req.path);

    })

serv.get('/', function(req, res) {
    //fall back for when the root is empty
    console.log('/' + getDate())

    res.redirect('/' + getDate());

})

serv.get("/*", function(req, res) {

    res.redirect('/' + getDate());

})

serv.listen(port);

/*
Now we get into the desktop app initializations
*/

const {app, BrowserWindow} = electron;

let win;

function createWindow() {

    win = new BrowserWindow({width: 800, height: 800});

    win.loadURL("http://localhost:8080/");

}

app.on('ready', createWindow);

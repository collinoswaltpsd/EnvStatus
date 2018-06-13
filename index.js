const express = require('express');
const sqlite3 = require('sqlite3');

const bodyParser = require('body-parser');
const app = express();

var Success = true;
var DB = new sqlite3.Database("__Environments", sqlite3.OPEN_READWRITE, function(err){
	if(err){
		DB = new sqlite3.Database("__Environments", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, function(err){
			DB.run("CREATE TABLE environments(x integer PRIMARY KEY
		})
	}
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.get("/check", (req, res) => {
	console.log(req);
});

app.post("/check", (req, res) => {
	console.log(req.body);
	console.log(req.headers['content-type']);
});


app.listen(3000, () => { console.log("Running on port 3000!") });


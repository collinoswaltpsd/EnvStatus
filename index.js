const express = require('express');
const sqlite3 = require('sqlite3');
const AsciiTable = require('ascii-table');

const bodyParser = require('body-parser');
const app = express();

var Success = true;
var DB = new sqlite3.Database("EnvironmentStatuses", sqlite3.OPEN_READWRITE, function(err){
	if(err){
		DB = new sqlite3.Database("EnvironmentStatuses", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, function(err){
			console.log("Creating new DBs");
			DB.run("CREATE TABLE environments(team varchar(128), name varchar(128) PRIMARY KEY, checkedout boolean, owner varchar(128), prno varchar(128));");
		})
	}
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.post("/check", (req, res) => {
	var Commands = req.body.text.split(" ");

	if(Commands[0].toLowerCase() === "status"){
		if(Commands.length == 1){
			DB.all("SELECT * FROM environments WHERE team = ?", [req.body.channel_name], function(err, rows){
				var Statuses = new AsciiTable();
				Statuses.setHeading("Name", "Checked out?", "Owner");

				for(var i in rows){
					Statuses.addRow(rows[i].name, rows[i].checkedout ? "Yes" : "No" , rows[i].owner);
				}
				res.json({
					text: "```" + Statuses.toString() + "```"
				});
				console.log(rows);
			});
		}else if(Commands.length > 1){
			DB.all("SELECT * FROM environments WHERE team = ? AND name = ?", [req.body.channel_name, Commands.slice(1, Commands.length).join(" ").toLowerCase()], function(err, rows){
				var Statuses = new AsciiTable();
				Statuses.setHeading("Name", "Checked out?", "Owner");

				for(var i in rows){
					Statuses.addRow(rows[i].name, rows[i].checkedout ? "Yes" : "No" , rows[i].owner);
				}
				res.json({
					text: "```" + Statuses.toString() + "```"
				});
			
				console.log(rows);
			})
		}
	}
	if(Commands[0].toLowerCase() == "create"){
		if(Commands.length == 1){
			res.json({
				text: "ERR: Must have an operand"
			});
			return
		}else{
			DB.run("INSERT INTO environments(team, name, checkedout, owner, prno) values(?, ?, ?, ?, ?)", [req.body.channel_name, Commands.slice(1, Commands.length).join(" ").toLowerCase(), false, "ADMIN", "N/A"], function(_res){
				res.json({
					text: "Created new environment '" + Commands.slice(1, Commands.length).join(" ").toLowerCase() + "'"
				});
			});
		}
	}if(Commands[0].toLowerCase() == "checkout"){
		if(Commands.length < 2){
			console.log("ERR: Must have at least 1 operand");
			res.json({
				text: "ERR: Must have at least 1 operand"
			});
			return
		}else{
			var FullName = Commands.slice(1, Commands.length).join(" ").toLowerCase().replace(" please", "");
			DB.get("SELECT * FROM environments WHERE team = ? AND name = ?", [req.body.channel_name, FullName], function(err, row){
				console.log(row);
				console.log("Checking out");
				if(row.checkedout){
					if(Commands[Commands.length - 1].toLowerCase() !== "please"){
						console.log("ERR: Env already checked out. If you wish to overwrite the owner of the env, say 'please'");
						res.json({
							text: "Error: Environment is already checked out. If you wish to overwrite the owner of the env, say `/environment checkout " + FullName + " please`"
						});
						return;
					}
				}

				DB.run("UPDATE environments SET checkedout = 1, owner = ? WHERE team = ? AND name = ?", [req.body.user_name, req.body.channel_name, FullName], function(err){
					res.json({
						text: "Checked out '" + FullName + "'"
					});
				});
			});
		}
	}if(Commands[0].toLowerCase() == "checkin"){
		if(Commands.length < 2){
			console.log("ERR: Must have at least 2 operands");
			res.json({
				text: "ERR: Must have at least 2 opearnds"
			});
			return;
		}else{
			var FullName = Commands.slice(1, Commands.length).join(" ").toLowerCase().replace(" please", "");
			DB.get("SELECT * FROM environments WHERE team = ? AND name = ?", [req.body.channel_name, FullName], function(err, row){
				if(!row.checkedout){
					res.json({
						text: "Error: Environment '" + FullName + "' is already checked in"
					});
					return;
				}
				if(row.owner !== req.body.user_name){
					if(Commands[Commands.length - 1].toLowerCase() !== "please"){
						res.json({
							text: "ERR: Env doesn't belong to you. If you wish to force it to check in, say 'please'"
						});
						return;
					}
				}
				console.log("Checking in");
				DB.run("UPDATE environments SET checkedout = 0 WHERE team = ? AND name = ?", [req.body.channel_name, FullName], function(err){
					res.json({
						text: "Checked in '" + FullName + "'"
					});
				});
			});
		}
	}
});


app.listen(3000, () => { console.log("Running on port 3000!") });


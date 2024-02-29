const e = require('express');
const bcrypt = require('bcrypt');
const conn = require('./../utils/dbconn');

//UPDATED FUNCTION : supports API
exports.postNewMoodLog = (req, res) => {
  const { id } = req.params; //user_id is an integer that will be used to store the user's id
  const { enjoyment, sadness, anger, contempt, disgust, fear, surprise, trigger, usernotes } = req.body; //get details from the request body to store in variables
  const vals = [id, sadness, anger, contempt, disgust, fear, surprise, trigger, usernotes]; //vals is an array that will be used to store the user's id, emotion name, emotion intensity and user notes
  var emotion_id = 0; //emotion_id is an integer that will be used to store the emotion's id
  var emotrigger_id = []; //emotrigger_id is an array that will be used to store the triggers' ids - this is necessary because a user can select multiple triggers
  console.log(req.body);

  // Function to execute a query and return a promise - code adapted from https://stackoverflow.com/questions/31413749/node-mysql-queries-in-a-promise-chain
  function executeQuery(sql, values) {
    return new Promise((resolve, reject) => {
      conn.query(sql, values, (err, rows) => {
        if (err) {
          res.status(500);
          res.json({
            status: 'failure',
            message: err
          });
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get emotrigger_ids from triggers into new array for adding to emotrigger_emotion_log table
const triggerarray = Array.isArray(trigger) ? trigger : [trigger];
const getEmotriggersPromises = triggerarray.map((element) => {
    const getEmotriggersSQL = `SELECT emotrigger_id FROM emotrigger WHERE emotrigger_name = ?`;
    return executeQuery(getEmotriggersSQL, [element]);
});

Promise.all(getEmotriggersPromises)
    .then((results) => {
      console.log(results);
        const emotrigger_id = results.map((rows) => rows[0].emotrigger_id);

        const insertSQL = `INSERT INTO emotion_log (emotion_log_id, time_stamp, user_id, enjoyment, sadness, anger, contempt, disgust, fear, surprise, user_notes) VALUES (NULL, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?); SELECT LAST_INSERT_ID()`;

        return executeQuery(insertSQL, [id, enjoyment, sadness, anger, contempt, disgust, fear, surprise , usernotes])
            .then((rows) => {
                const lastInsertId = rows[1][0]['LAST_INSERT_ID()'];

                const insertPromises = emotrigger_id.map((element) => {
                    const insertSQL = `INSERT INTO emotrigger_emotion_log VALUES (NULL, ?, ?)`;
                    return executeQuery(insertSQL, [element, lastInsertId]);
                });

                return Promise.all(insertPromises);
            });
    })
    .then(() => {
        console.log('All queries done');
        res.status(200);
        res.json({
          status: 'success',
          message: 'Mood log added'
        });
    })
    .catch((err) => {
        throw err;
    });
};

//UPDATED FUNCTION : supports API
exports.getMoodHistory = (req, res) => {
        const { id } = req.params;
        console.log(id);
        const selectSQL = 'SELECT time_stamp, enjoyment, sadness, anger, contempt, disgust, fear, surprise, user_notes, emotion_log_id FROM emotion_log WHERE user_id = ?';
        conn.query(selectSQL, id, (err, rows) => {
          //if there is an error, handle it - code adapted from https://www.w3schools.com/nodejs/nodejs_mysql_select.asp and https://www.w3schools.com/js/js_errors.asp
          try {
              conn.query(selectSQL, id, (err, rows) => {
                if (err) {
                  res.status(500);
                  res.json({
                    status: 'failure',
                    message: err
                  })
                } else {
                  if (rows.length > 0) {
                    res.status(200);
                    res.json({
                      status: 'success',
                      message: 'Mood history retrieved',
                      data: rows
                    });
                  } else {
                    res.status(404);
                    res.json({
                      status: 'failure',
                      message: 'No mood history found'
                    });
                  }
                }
              });
            } catch (err) {
              console.error(err);
            };
        });
      };

//UPDATED FUNCTION : supports API
exports.postregistration = async (req, res) => {
    const {firstname, lastname, useremail, password_new} = req.body;
    const hashedPassword = await bcrypt.hash(password_new, 13);
    const vals = [firstname, lastname, useremail, hashedPassword];
    console.log(vals);
    var registration_successful;

    //check if email is already registered
    const checkEmailSQL = 'SELECT email FROM user WHERE email = ?';
    conn.query(checkEmailSQL, useremail, (err, rows) => {
        if (err) {
          res.status(500);
          res.json({
            status: 'failure',
            message: err
          });
        } else {
        console.log(rows);
        if (rows.length > 0) {
            console.log('Email already registered');
            res.status(409);
            res.json({
              status: 'failure',
              message: 'Email already registered'
            });
        } else {
          const insertSQL = 'INSERT INTO user (user_id, first_name, last_name, email, password) VALUES (NULL, ?, ?, ?, ?)';
          conn.query(insertSQL, vals, (err, rows) => {
            if (err) {
              res.status(500);
              res.json({
                status: 'failure',
                message: err
              });
            } else {
            console.log(rows);
            res.status(201);
            res.json({
              status: 'success',
              message: 'User registered'
            });
            }
          })
            
        }
      }
    });
};

//UPDATED FUNCTION : supports API - password check not working
exports.postLogin = async (req,res) => {
    const {useremail, userpass} = req.body;
    console.log(useremail, userpass);
    const vals = [useremail, userpass ];
    console.log(vals);

    const checkUserSQL = `SELECT user_id, first_name, password FROM user WHERE email = ?`;

    conn.query(checkUserSQL, vals, async (err, rows) => {
    if (err) {
      res.status(500);
      res.json({
        status: 'failure',
        message: err
      });
    } else {
      
      const numrows = rows.length;
    if (numrows > 0) {
      console.log('user found');
      storedpass = rows[0].password;
      console.log(rows[0].password)
      console.log(userpass)
      if (await bcrypt.compare(userpass, storedpass)) {
        console.log('password correct');
        res.status(200);
        res.json({
          status: 'success',
          message: 'User logged in',
          user_id: rows[0].user_id, 
          name: rows[0].first_name
        });
      } else {
        console.log('incorrect password');
        res.status(401);
        res.json({
          status: 'failure',
          message: 'Incorrect password'
        });
      }
      } else {
      console.log('user not found');
      res.status(404);
      res.json({
        status: 'failure',
        message: 'User not found'
      });
    };}
  });
};

//UPDATED FUNCTION : supports API
exports.selectLog = (req, res) => {
  const id = req.query.param1;
  const {emotion_log_id} = req.query.param2;
  let verified_id;
  const selectSQL = `SELECT * FROM emotrigger; SELECT * FROM emotion_log INNER JOIN emotrigger_emotion_log ON emotion_log.emotion_log_id = emotrigger_emotion_log.emotion_log_id INNER JOIN emotrigger ON emotrigger_emotion_log.emotrigger_id = emotrigger.emotrigger_id WHERE emotion_log.emotion_log_id = ?`;
  conn.query(selectSQL, emotion_log_id, (err, rows) => {
    if (err) {
      res.status(500);
      res.json({
        status: 'failure',
        message: err
      })
    } else {
      console.log(rows);
      if (rows[1].length ===0 ) {
        res.status(404);
        res.json({
          status: 'failure',
          message: 'Log not found'
        });
      } else {
      const selecttriggers = rows[0];//selecttriggers is an array that will be used to store the triggers
      const details = rows[1];//details is an array that will be used to store the details of the mood log
      const triggers = rows[1].map(row => row.emotrigger_name); // Extract emotrigger_name values
      verified_id = details[0].user_id;
      console.log(verified_id);
      console.log(id);
      //ensure that the user is logged in and that the user is the owner of the mood log
      if (id != verified_id) {
        res.status(403);
        res.json({
          status: 'failure',
          message: 'You are not authorized to view this log'
        });
      } else {
        res.status(200);
        res.json({
          status: 'success',
          message: 'Log retrieved',
          data: details, triggers, selecttriggers
        });
      }
    }
  }
  });
};

//UPDATED FUNCTION : supports API
exports.editMoodLog = async (req, res) => {
  try {
    const { enjoyment, sadness, anger, contempt, disgust, fear, surprise, trigger, usernotes } = req.body; //get details from the request body to store in variables
    let triggers = Array.isArray(trigger) ? trigger : [trigger];
    triggers = triggers.map(trigger => trigger.replace(/\r\n/g, ''));
    // Remove empty elements from the 'triggerArray'
    triggers = triggers.filter(trigger => trigger.trim() !== '');
    const trigger_id = [];

    // Get emotrigger_id from trigger_name
    const getEmotriggersSQL = `SELECT emotrigger_id FROM emotrigger WHERE emotrigger_name = ?`;
    const getTriggerIdPromises = triggers.map((trigger) => {
      return new Promise((resolve, reject) => {
        conn.query(getEmotriggersSQL, [trigger], (err, rows) => {
          if (err) {
            reject(err);
            res.status(500);
            res.json({
              status: 'failure',
              message: err
            });
          } else {
            trigger_id.push(rows[0].emotrigger_id);
            resolve();
          }
        });
      });
    });

    await Promise.all(getTriggerIdPromises); // Wait for all queries to complete

    //remove existing emotrigger_emotion_log entries
    const deleteSQL = `DELETE FROM emotrigger_emotion_log WHERE emotion_log_id = ?`;
    await new Promise((resolve, reject) => {
      conn.query(deleteSQL, [req.params.id], (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Deleted existing triggers');
          resolve();
        }
      });
    });

    //add new emotrigger_emotion_log entries
    const insertSQL = `INSERT INTO emotrigger_emotion_log VALUES (NULL, ?, ?)`;
    const insertPromises = trigger_id.map((trigger) => {
      return new Promise((resolve, reject) => {
        conn.query(insertSQL, [trigger, req.params.id], (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });

    await Promise.all(insertPromises); // Wait for all queries to complete

    // Update emotion_log table
    let updateSQL;
    if (usernotes == '') {
      updateSQL = `UPDATE emotion_log SET enjoyment=?, sadness=?, anger=?, contempt=?, disgust=?, fear=?, surprise=? WHERE emotion_log_id = ?`;
    } else {
      updateSQL = `UPDATE emotion_log SET enjoyment=?, sadness=?, anger=?, contempt=?, disgust=?, fear=?, surprise=?, user_notes=? WHERE emotion_log_id = ?`;
    }

    await new Promise((resolve, reject) => {
      conn.query(updateSQL, usernotes == '' ? [enjoyment, sadness, anger, contempt, disgust, fear, surprise, req.params.id] : [enjoyment, sadness, anger, contempt, disgust, fear, surprise, usernotes, req.params.id], (err) => {
        if (err) {
          reject(err);

        } else {
          console.log('Updates complete');
          resolve();
          res.status(200);
          res.json({
            status: 'success',
            message: 'Log updated'
          });
        }
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500);
    res.json({
      status: 'failure',
      message: err
    });
  }
};

//UPDATED FUNCTION : supports API
exports.deleteMoodLog = (req, res) => {
  // delete from emotrigger_emotion_log
  const deleteTriggerSQL = `DELETE FROM emotrigger_emotion_log WHERE emotion_log_id = ?`;
  conn.query(deleteTriggerSQL, [req.params.id], (err) => {
    if (err) {
      throw err;
    }
  });
  // delete from emotion_log
  const deleteSQL = `DELETE FROM emotion_log WHERE emotion_log_id = ?`;
  conn.query(deleteSQL, [req.params.id], (err) => {
    if (err) {
      res.status(500);
      res.json({
        status: 'failure',
        message: err
      });
    } else {
      res.status(200);
      res.json({
        status: 'success',
        message: 'Log deleted'
      });
    }
    
  });
};

//UPDATED FUNCTION : supports API
exports.getLogger = (req, res) => {
  //load the emotions and triggers from the database
  const selectSQL = 'SELECT * FROM emotion; SELECT * FROM emotrigger';
  conn.query(selectSQL, (err, rows) => {
    if (err) {
      res.status(500);
      res.json({
        status: 'failure',
        message: err
      });
    } else {
      const selectemotions = rows[0];//selectemotions is an array that will be used to store the emotions
      const selecttriggers = rows[1];//selecttriggers is an array that will be used to store the triggers
      res.status(200);
      res.json({
        status: 'success',
        message: 'Data retrieved',
        selectemotions: selectemotions,
        selecttriggers: selecttriggers
      });
    }
  });
};

//UPDATED FUNCTION : supports API
exports.getChart = (req, res) => {
  const { id } = req.params;
  
  const averagesSQL = 'SELECT AVG(enjoyment) AS avg_enjoyment, AVG(sadness) AS avg_sadness, AVG(anger) AS avg_anger, AVG(contempt) AS avg_contempt, AVG(disgust) AS avg_disgust, AVG(fear) AS avg_fear, AVG(surprise) AS avg_surprise FROM emotion_log WHERE user_id=?;';
  conn.query(averagesSQL, id, (err, averages) => {
    if (err) {
      res.status(500);
      res.json({
        status: 'failure',
        message: err
      });
    } else {
      if (averages[0].avg_enjoyment === null) {
        res.status(404);
        res.json({
          status: 'failure',
          message: 'No data found',
          chartinput: averages[0],
          charttriggers: [],
          chartempty: true
        });
      } else {
          const triggersSQL = 'SELECT emotrigger.emotrigger_name, AVG(emotion_log.enjoyment) AS avg_enjoyment, AVG(emotion_log.sadness) AS avg_sadness, AVG(emotion_log.anger) AS avg_anger, AVG(emotion_log.contempt) AS avg_contempt, AVG(emotion_log.disgust) AS avg_disgust, AVG(emotion_log.fear) AS avg_fear, AVG(emotion_log.surprise) AS avg_surprise FROM emotion_log INNER JOIN emotrigger_emotion_log ON emotion_log.emotion_log_id = emotrigger_emotion_log.emotion_log_id INNER JOIN emotrigger ON emotrigger_emotion_log.emotrigger_id = emotrigger.emotrigger_id GROUP BY emotrigger.emotrigger_name';
          conn.query(triggersSQL, (err, triggers) => {
          if (err) {
            res.status(500);
            res.json({
              status: 'failure',
              message: err
            });
      } else {
        if (triggers.length === 0) {
          res.status(404);
          res.json({
            status: 'failure',
            message: 'No data found',
            chartinput: averages[0],
            charttriggers: [],
            chartempty: true
          });
      } else {
        res.status(200);
        res.json({
          status: 'success',
          message: 'Data retrieved',
          chartinput: averages[0],
          charttriggers: triggers,
          chartempty: false
        });
        }
     }
    });
      }
    }
  });
  

};
const express = require('express');
const controller = require('./../controllers/szencontrollers');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();

//router.get('/log', /*isAuthenticated,*/ controller.getLogger);
router.get('/history/:id', /*isAuthenticated,*/ controller.getMoodHistory);
router.get('/select/:id', /*isAuthenticated,*/ controller.selectLog);
router.get('/logger/', /*isAuthenticated,*/ controller.getLogger);

router.delete('/delete/:id', /*isAuthenticated,*/ controller.deleteMoodLog);

//router.get('/newlog', /*isAuthenticated,*/ controller.getNewMoodLog);
router.get('/chart/:id', /*isAuthenticated,*/ controller.getChart);

router.post('/log/:id', controller.postNewMoodLog);

router.put('/edit/:id', controller.editMoodLog);
router.post('/login', controller.postLogin);
router.post('/register', controller.postregistration);

module.exports = router;
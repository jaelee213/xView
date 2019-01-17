const express = require('express');
const router = express.Router();
require('dotenv').config();
const session = require('express-session');
const request = require('request');
const qs = require('querystring');
const randomString = require('uuid');
const csrfString = randomString();
const authController = require('../controllers/auth-controller');
const userController = require('../controllers/user-controller');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

/************************ GITHUB OAUTH ************************/

// initialize session
router.use(
	session({
		secret: randomString(),
		cookie: { expires: false },
		resave: false,
		saveUninitialized: false,
	})
);

router.use(cookieParser())

// the initial route when user presses login button
router.get('/github', (req, res, next) => {
	// generate csrf_string for 'state' parameter
	req.session.csrf_string = randomString();
	const githubAuthUrl = 
		'http://github.com/login/oauth/authorize?' + 
		qs.stringify({
			client_id: process.env.CLIENT_ID,
			redirect_uri: 'http://127.0.0.1:3000/login/github/callback',
			state: req.session.csrf_string,
		});
	// redirect user with express
	res.redirect(githubAuthUrl);
});

router.all('/github/callback', (req, res) => {
	const code = req.query.code;
	const returnedState = req.query.state;
	// if state matches, send request to get access token
	if (req.session.csrf_string === returnedState) {
		request.post(
			{
				url:
					'https://github.com/login/oauth/access_token?' +
					qs.stringify({
						client_id: process.env.CLIENT_ID,
						client_secret: process.env.CLIENT_SECRET,
						code: code,
						state: req.session.csrf_string,
					})
			},
			(err, response, body) => {
				// response will contain your new access token store token in session
				req.session.access_token = qs.parse(body).access_token;
				// redirect user to /home page 
				res.redirect('/login/gitHubLogin');
			},
		);
	} else {
		// if state doesn't match up, redirect to homepage
		res.redirect('/');
	}
});

// sends back the user that was found
router.get('/gitHubLogin', authController.getGitHubUser, userController.verifyUser, (req, res) => {
	console.log('sending')
	res.status(200).send({ loggedIn: true });
});

/******************************************************************************************/

/*************************************** GOOGLE OAUTH ****************(********************/

router.get('/google', (req, res) => {

});

/******************************************************************************************/

// error handler 
router.use((err, req, res, next) => {
	res.status(500).send({'Error': err});
});

module.exports = router;
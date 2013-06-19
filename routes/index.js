var path = require('path')
  , request = require('request')
  , qs = require('querystring')
  , Core = require( path.resolve(__dirname, '../plugins/core/core.js') ).Core
  , ynote = require('ynote')
  , markdown = require('node-markdown').Markdown;

var consumer_key = "3c4f46612f284e8b81d505ad83ce7630";
var consumer_secret = "edbcf9d615a42f9a03a7d5b71afa511f";

var ynoteClient = new ynote.ynoteClient(consumer_key, consumer_secret);

// Show the home page
exports.index = function(req, res) {
  
  // Some flags to be set for client-side logic.
  var indexConfig = {
    isDropboxAuth: !!req.session.isDropboxSynced,
    isYnoteAuth: !!req.session.isYnoteSynced,
    username: req.session.username
  }
  
  return res.render('index', indexConfig)
}

// Show the not implemented yet page
exports.not_implemented = function(req, res) {
  res.render('not-implemented')
}

/* Core stuff */

exports.fetch_md = Core.fetchMd
exports.download_md = Core.downloadMd
exports.fetch_html = Core.fetchHtml
exports.fetch_html_direct = Core.fetchHtmlDirect
exports.download_html = Core.downloadHtml

exports.save_ynote = function(req, res) {
  if(!req.session.isYnoteSynced){
        res.type('text/plain')
        return res.status(403).send("You are not authenticated with ynote.")
  }

  ynoteClient.createNote(req, null, req.body.title, "Hou", "www.hou.com", markdown(req.body.unmd), function(success, body){
          console.log(success);
          console.log(body);
          if(success){
            return res.json({data: body})
          }
          else{
            return res.status(403).send("save to ynote is error")
          }
      }
  );
}

/* End Core stuff */

exports.oauth_ynote_redirect = function(req, res) {
  if(!req.session.ynote){
    req.session.ynote = {};
  }
  ynoteClient.getRequestToken(
        function(jsonRes){
            var jsonRes = JSON.parse(jsonRes);
            //token = jsonRes.requestToken;
            //tokenSecret = jsonRes.requestTokenSecret;
            req.session.ynote.token = jsonRes.requestToken;
            req.session.ynote.tokenSecret = jsonRes.requestTokenSecret;
            //set the query string
            var tmp = qs.stringify({oauth_token: jsonRes.requestToken, oauth_callback: "http://hou.ap01.aws.af.cm/oauth/ynote"});
            res.redirect(jsonRes.authorizeURI + '?' + tmp);
        }
    );
}

exports.oauth_ynote = function(req, res) {
  //console.log(req.body.unmd);
  ynoteClient.getAccessToken(req.session.ynote.token, req.session.ynote.tokenSecret, req.query.oauth_verifier, function(jsonRes){
        var jsonRes = JSON.parse(jsonRes);
        //test to get user's infomation
        // ynoteClient.createNote(null, "a", "Hou", "www.hou.com", markdown(req.body.unmd), function(success, body){
        //         console.log(success);
        //         console.log(body);
        //     }
        // );
        req.session.ynote.accessToken = jsonRes.accessToken;
        req.session.ynote.accessTokenSecret = jsonRes.accessTokenSecret;
        req.session.isYnoteSynced = true;

        ynoteClient.getUserInfo(
            function(success, body){
                console.log(success);
                console.log(body);
                var userInfo = JSON.parse(body);
                console.log(userInfo);
                console.log(userInfo.user);
                req.session.username = userInfo.user;
            }
        );
        res.redirect("/");
    });
}

exports.unlink_ynote = function(req, res) {
  delete req.session.ynote;
  req.session.isYnoteSynced = false;
  res.redirect('/')
}
var path = require('path')
  , request = require('request')
  , qs = require('querystring')
  , Core = require( path.resolve(__dirname, '../plugins/core/core.js') ).Core

// Show the home page
exports.index = function(req, res) {
  
  // Some flags to be set for client-side logic.
  var indexConfig = {
    isDropboxAuth: !!req.session.isDropboxSynced,
    isGithubAuth: !!req.session.isGithubSynced,
    isEvernoteAuth: !!req.session.isEvernoteSynced,
    isGoogleDriveAuth: !!req.session.isGoogleDriveSynced,
    isUsingDroboxDefaultConfig: null,
    isUsingGithubDefaultConfig: null 
  }
  
  if(req.session.github && req.session.github.username) indexConfig.github_username = req.session.github.username
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

/* End Core stuff */


/* Dropbox Stuff */

exports.oauth_dropbox_redirect = function(req, res) {
  Dropbox.getNewRequestToken(req, res, function(status, request_token) {

    var dropbox_auth_url = Dropbox.config.auth_url + 
                    "?oauth_token=" + request_token.oauth_token + 
                    "&oauth_callback=" + 
                    Dropbox.config.callback_url

    console.log(dropbox_auth_url + " is the auth_url for dropbox")      

    // Create dropbox session object and stash for later.
    req.session.dropbox = {}
    req.session.dropbox.oauth = {
      request_token: request_token.oauth_token,
      request_token_secret: request_token.oauth_token_secret,
      access_token_secret: null,
      access_token: null
    }
    
    res.redirect(dropbox_auth_url)

  }) 
}

exports.oauth_dropbox = function(req, res) {
  
  console.dir(req.query)
    
    if(!req.session.dropbox){
      console.log('No dropbox session - browser bug')
      req.session.dropbox = {}
      req.session.dropbox.oauth = {}
    }

    // Create dropbox session object and stash for later.
    req.session.dropbox.oauth.access_token_secret = null
    req.session.dropbox.oauth.access_token = null
  
    // We are now fetching the actual access token and stash in
    // session object values in callback.
    Dropbox.getRemoteAccessToken( 
      req.session.dropbox.oauth.request_token, 
      req.session.dropbox.oauth.request_token_secret,
      function(status, access_token){

          console.log(access_token)
          req.session.dropbox.oauth.access_token_secret = access_token.oauth_token_secret,
          req.session.dropbox.oauth.access_token = access_token.oauth_token
          req.session.dropbox.uid = access_token.uid
          req.session.isDropboxSynced = true
          
          // Check to see it works by fetching account info
          Dropbox.getAccountInfo(req.session.dropbox, function(status, reply){

            console.log('Got account info!')
            console.log(reply)
            console.log("User %s is now authenticated.", reply.display_name )
          })
        
          // Now go back to home page with session data in tact.
          res.redirect('/')
      
    })  // end dbox.getRemoteAccessToken()    
  
  
}

exports.unlink_dropbox = function(req, res) {
  // Essentially remove the session for dropbox...
  delete req.session.dropbox
  req.session.isDropboxSynced = false
  res.redirect('/')
}

exports.import_dropbox = function(req, res) {

  Dropbox.searchForMdFiles(req.session.dropbox, function(status, data) {
    res.json(data)
  })

}

exports.fetch_dropbox_file = function(req, res) {

  Dropbox.fetchDropboxFile(req,res)
  
}

exports.save_dropbox = function(req, res) {

  Dropbox.saveToDropbox(req, res)
  
}

/* End Dropbox stuff */


/* Github stuff */

exports.oauth_github_redirect = function(req, res) {
  // Create dropbox session object and stash for later.
    req.session.github = {}
    req.session.github.oauth = {
      request_token: null,
      request_token_secret: null,
      access_token_secret: null,
      access_token: null
    }

    var uri = Github.generateAuthUrl()
    console.log(uri)
    
    res.redirect(uri)
}

exports.oauth_github = function(req, res, cb) {

  if(!req.query.code) cb()
  else{
    req.session.oauth = {}
    
      var code = req.query.code
        , client_id = Github.github_config.client_id
        , redirect_uri = Github.github_config.redirect_uri
        , client_secret = Github.github_config.client_secret
      
      var params = '?code='+code
                    +'&client_id='+client_id
                    +'&redirect_url='+redirect_uri
                    +'&client_secret='+client_secret
    
      var uri = 'https://github.com/login/oauth/access_token'+params

      request.post(uri, function(err, resp, body){
        // TODO: MAKE THIS MORE GRACEFUL
        if(err) res.send(err.message)
        else {
          // access_token=519e3f859210aa34265a52acb6b88290087f8996&token_type=bearer
          if(!req.session.github){
            req.session.github = {
              oauth: null
            }
          }
          req.session.github.oauth = (qs.parse(body)).access_token
          req.session.isGithubSynced = true
          console.log('about')
          Github.getUsername(req,res,function(){
            res.redirect('/')
          })
          
        }
      })
    
    } // end else
}

exports.unlink_github = function(req,res){
  // Essentially remove the session for dropbox...
  delete req.session.github
  req.session.isGithubSynced = false
  res.redirect('/')
}

exports.import_github_repos = function(req,res){
  
  Github.searchForMdFiles(req,res)
  
}

exports.import_github_branches = function(req,res){

  Github.fetchGithubBranches(req,res)
  
}

exports.import_tree_files = function(req,res){

  Github.fetchTreeFiles(req,res)
  
}

exports.import_github_file = function(req,res){

  Github.fetchFile(req,res)
  
}

exports.save_github = function(req,res){

  Github.saveToDropbox(req, res)
  
}

/* End Github stuff */
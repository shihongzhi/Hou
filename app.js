
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')

var app = express()

app.configure(function(){
  app.set('port', process.env.VCAP_APP_PORT || 3000)
  app.set('views', __dirname + '/views')
  app.set('view engine', 'ejs')
  app.use(express.favicon())
  app.use(express.logger('dev'))
  app.use(express.compress())
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(express.cookieParser('your secret here'))
  app.use(express.cookieSession())
  app.use(app.router)
  app.use(require('stylus').middleware(__dirname + '/public'))
  app.use(express.static(path.join(__dirname, 'public')))

  // Setup local variables to be available in the views.
  app.locals.title = "Online Markdown Editor for ynote"
  app.locals.description = "Hou is an Online Markdown Editor for ynote"
  app.locals.node_version = process.version.replace('v', '')
  app.locals.app_version = require('./package.json').version
  app.locals.env = process.env.NODE_ENV
  app.locals.readme = fs.readFileSync( path.resolve(__dirname, './README.md'), 'utf-8')
})

app.configure('development', function(){
  app.use(express.errorHandler())
})

app.get('/', routes.index)

app.get('/not-implemented', routes.not_implemented)

app.get('/redirect/ynote', routes.oauth_ynote_redirect)

app.get('/oauth/ynote', routes.oauth_ynote)

app.get('/unlink/ynote', routes.unlink_ynote)

app.post('/factory/save_ynote', routes.save_ynote)

/* Hou Actions */
// save a markdown file and send header to download it directly as response 
app.post('/factory/fetch_markdown', routes.fetch_md)

// Route to handle download of md file
app.get('/files/md/:mdid', routes.download_md)

// Save an html file and send header to download it directly as response 
app.post('/factory/fetch_html', routes.fetch_html)
app.post('/factory/fetch_html_direct', routes.fetch_html_direct)

// Route to handle download of html file
app.get('/files/html/:html', routes.download_html)


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'))
  console.log("\nhttp://localhost:" + app.get('port') + "\n")
})

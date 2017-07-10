var Botkit = require('botkit');

if (!process.env.Client_ID || !process.env.Client_Secret || !process.env.Verification_Token|| !process.env.PORT) {
  console.log('Error: Specify clientId clientSecret and port in environment');
  process.exit(1);
}

var controller = Botkit.slackbot({
  json_file_store: './db_slackbutton_slashcommand/',
}).configureSlackApp({
  clientId: process.env.Client_ID,
  clientSecret: process.env.Client_Secret,
  scopes: ['commands']
});


controller.setupWebserver(process.env.PORT,function(err,webserver) {

  controller.createWebhookEndpoints(controller.webserver);

  controller.createOauthEndpoints(controller.webserver,function(err,req,res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } else {
      res.send('Success!');
    }
  });
});

var request = require('request');
var base_url = 'https://image.tmdb.org/t/p/w185';

controller.on('slash_command', function (slashCommand, message) {
  switch (message.command) {
    case '/movie':
      if (message.token !== process.env.Verification_Token) return;
      if (message.text === '') {
        slashCommand.replyPrivate(message, 'I give you back a movie with all information according to your search word! Try type \n`/movie star wars episode 4` :smile: \n You have to be very specific!');
        return;
      }else if(message.text !== '') {
        var movie_search_title = message.text;
        var url_query = 'https://api.themoviedb.org/3/search/movie?api_key=87a3acc12bd88c311e7dcc9c41542560&query=' +movie_search_title+ '';

        request({ url: url_query, json: true }, function (error, response, body) {
          var movies = body.results;

          if (movies.length !== 0) {
            var movie_id_gen = body.results[0].id;
            var url_id = 'https://api.themoviedb.org/3/movie/' +movie_id_gen+ '?api_key=87a3acc12bd88c311e7dcc9c41542560&language=en-US';
            request({ url: url_id, json: true }, function (error, response, body) {
              slashCommand.replyPublic(message, generate_movie_text(body));
            });
          }else if(body.total_results === 0) {
            slashCommand.replyPrivate(message, 'I wasn\'t able to find any movies by that name:sweat:. Please try to be more specific');
          }
        });
      }

      break;

    default:
      slashCommand.replyPrivate(message, 'Darn something went wrong. Sorry...');

  }

})
;

function generate_movie_text(movies){
  var image_url = movies.poster_path;
  var movie_title = movies.title;
  var discription = movies.overview;
  var release_uncut = movies.release_date;
  var release = release_uncut.substring(0, 4);
  var vote = movies.vote_average;
  var genre_id = '';
  if(movies.genres[0] === undefined){
    genre_id = 'Who knows?';
  }else if(movies.genres[0].name !== undefined){
    genre_id = movies.genres[0].name;
  }
  var time_unfunc = movies.runtime;
  var runtime = time_func(time_unfunc);
  var homepage = '';
  var more = '';
  if (movies.homepage !== '') {
    homepage = movies.homepage.substring(7);
    more = 'More--> ';
  }
  return (''+base_url+ '' +image_url+ '\n*' +movie_title+ '*\n' +discription+ '\n _' +genre_id+ ' ‧ ' +release+ ' ‧ ' +vote+ '/10 ‧ ' +runtime+ '_\n' +more+ '' +homepage+ '');
}


function time_func(time) {
  var hours = Math.trunc(time/60);
  var minutes = time % 60;
  return '' +hours+ 'h ' +minutes+ 'm';
}
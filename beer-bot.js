var Botkit = require('botkit');
var request = require('request');

if (!process.env.Client_ID || !process.env.Client_Secret || !process.env.Verification_Token|| !process.env.PORT) {
  console.log('Error: Specify clientId clientSecret and port in environment');
  process.exit(1);
}

var controller = Botkit.slackbot({
  json_file_store: '../tmp/db_slackbutton_slashcommand/',
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


controller.on('slash_command', function (slashCommand, message) {
  switch (message.command) {
    case '/beer':
      if (message.token !== process.env.Verification_Token) return;
      if (message.text === '' || message.text === 'help') {
        slashCommand.replyPrivate(message, 'Here to help! You can grab some Information about beer and stuff... These are the possible parameters with explanation');
        return;
      }else if(message.text !== '') {
        var url_query = 'http://api.brewerydb.com/v2/search?q=' +message.text+ '&type=beer&key=7e367304aa444c88ebb5251923d4e8c6';

        request({ url: url_query, json: true }, function (error, response, body) {
          if (body.data !== undefined) {
            var beer = body.data[0];

            slashCommand.replyPublic(message, generate_beer_text(beer));
            generate_beer_text(beer)
          } else {
            slashCommand.replyPrivate(message, 'Sorry, but i couldn\'t find your beer :sweat:... Try to be more specific or go add the beer to the database here --> http://www.brewerydb.com/add');
          }
        });
      }

      break;

    default:
      slashCommand.replyPrivate(message, 'Darn something went wrong. Sorry...');

  }

})
;

function generate_beer_text(body){
  var urlIn = 'http://api.brewerydb.com/v2/beer/' + body.id + '/ingredients?key=7e367304aa444c88ebb5251923d4e8c6'
  var urlBrew = 'http://api.brewerydb.com/v2/beer/' + body.id + '/breweries?key=7e367304aa444c88ebb5251923d4e8c6'
  var ingredients = 'No ingredients available';
  var brewery = 'No breweries avilable'
  request({ url: urlIn, json: true }, function (error, response, body) {
    ingredients = '';
    if (body.data !== undefined) {
      for (var i = 0; i<=body.data.count; i++) {
        ingredients += ' ' + body.data[i].name
      }
    }
  });
  var srmColor = getColor(parseInt(body.style.srmMax));
  return {
    "attachments": [
      {
        "fallback": "Whatever",
        "color": "" + srmColor + "",
        "title": "" + body.name + "",
        "text": "" + body.style.description + "",
        "fields": [
          {
            "title": "Data",
            "value": "ABV: " + body.abv + "% • IBU: " + body.style.ibuMax + " • SRM: " + body.style.srmMax + " (The stripe on the left is the color of the beer)\n Style: " + body.style.name + ""
          }
        ],
        "footer": "Beer Bot by Matteo Piatti",
        "footer_icon": "https://cdn.iconscout.com/public/images/icon/free/png-512/beer-mug-glass-drink-cocktail-emoj-symbol-babr-369f133aa5b11abf-512x512.png"
      }
    ]
  };
}

function getColor(SRM) {
  if (SRM >= 0 && SRM <= 2) {
    return '#F8F753';
  } else if (SRM === 3) {
    return '#F6F513';
  } else if (SRM === 4) {
    return '#ECE61A';
  } else if (SRM === 5 || SRM === 6) {
    return '#D5BC26';
  } else if (SRM === 7 || SRM === 8) {
    return '#BF923B';
  } else if (SRM === 9 || SRM === 10) {
    return '#BF813A';
  } else if (SRM >= 11 && SRM <= 13) {
    return '#BC6733';
  } else if (SRM >= 14 && SRM <= 17) {
    return '#8D4C32';
  } else if (SRM >= 18 && SRM <= 20) {
    return '#5D341A';
  } else if (SRM >= 21 && SRM <= 24) {
    return '#261716';
  } else if (SRM >= 25 && SRM <= 29) {
    return '#030403';
  } else if (SRM >= 30 && SRM <= 35) {
    return '#080707';
  } else if (SRM >= 35) {
    return '#030403';
  }
}

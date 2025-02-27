/** required start point
    pepperfield 2022
    v1.0.0
**/

addEventListener('fetch', event => {
  event.respondWith(fetchAndRespond(event.request))
})

function cleanArray(actual) {
  var newArray = new Array();
  for (var i = 0; i < actual.length; i++) {
    if (actual[i]) {
      newArray.push(actual[i]);
    }
  }
  return newArray;
}

function returnHeader(title="Turning dig... to JSON") {
  html = `<!DOCTYPE html>
          <html lang="en">
          <head>
          <meta charset="utf-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Dig | ${title}</title>
          <link href="https://cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/slate/bootstrap.min.css" rel="stylesheet">
          <link rel="icon" type="image/x-icon" href="https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/apple/285/pick_26cf-fe0f.png">
          <style type="text/css">body{padding-top:50px;margin-bottom:60px}.starter-template{padding:40px 15px;text-align:center}.btn-primary,.navbar-inverse,.panel-primary>.panel-heading{background-color:#0077da}a.navbar-brand{color:#fff}.footer{position:fixed;bottom:0;width:100%;height:60px;background-color:#f5f5f5}.container .text-muted{margin:20px 0;color:#707070}</style>
          </head>
          <body>
          <nav class="navbar navbar-inverse navbar-fixed-top">
          <div class="container">
          <div class="navbar-header">
          <a class="navbar-brand" href="/">Dig</a>
          </div>
          </div>
          </nav>`
  return html
}

function returnFooter() {
  html = `<footer class="footer" style="background-color:#7a8288;">
          <div class="container">
          <p class="text-muted" style="color:#000;">&copy; <script type="text/javascript">document.write(new Date().getFullYear());</script> This script is written using only <a href="https://cloudflareworkers.com" target="_blank">Cloudflare Workers</a></p>',
          </div>
          </footer>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.6/js/bootstrap.min.js"></script>
          </body>
          </html>`
  return html
}

/**
 * Fetch and log a given request object
 * @param {Request} request
 */
async function fetchAndRespond(request) {
    const init = {
      method: 'GET'
    }

    const supportedTypes = [
      'A',
      'AAAA',
      'CAA',
      'CNAME',
      'DS',
      'DNSKEY',
      'MX',
      'NS',
      'NSEC',
      'NSEC3',
      'RRSIG',
      'SOA',
      'TXT'
    ]

    reqUrl = new URL(request.url).pathname
    
    if (reqUrl == '/') {
      if (request.method == 'POST') {
        const formData = await request.formData()
        
        if (formData.get('recordType') == 'Type') {
          recordType = 'A'
        }
        else {
          recordType = formData.get('recordType')
        }

        return new Response('', {
          status: 301,
          headers: {'Location': `/${formData.get('recordName')}/${recordType}`}
        })
      }
      if (request.method == 'GET') {
        let data = `<div class="container">
          <div class="starter-template">
          <p class="lead">
          Got DNS? 🥛<br>
          </p>
          <p>&nbsp;</p>
          <div class="panel panel-primary">
          <div class="panel-heading" style="background-color:#7a8288;">
          <h2 class="panel-title">Lookup a record</h3>
          </div>
          <div class="panel-body">
          <form class="form-inline" method="POST" action="/">
          <fieldset>
          <div class="form-group">
          <input name="recordName" class="form-control" id="recordName" placeholder="example.com">
          </div>
          <div class="form-group">
          <select class="form-control" id="recordType" name="recordType">
          <option>Type</option>
          <option>${supportedTypes.join('</option><option>')}</option>
          </select>
          </div>
          <div class="form-group">
          <button type="submit" class="btn btn-primary">Lookup</button>
          </div>
          </fieldset>
          </form>
          </div>
          </div>
          </div>
          </div>
          `
        output = [
          returnHeader('Turning dig... to JSON'),
          data,
          returnFooter()
        ]
        return new Response(output.join('\r\n'), {
          headers: {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*'
          }
        })
      }
    }
    else {
      reqUrl = cleanArray(new URL(request.url).pathname.split('/'))

      domain = reqUrl[0].toLowerCase();
      data = reqUrl[1].toLowerCase().split('.');

      if (data.length < 2) {
        qtype = reqUrl[1].toUpperCase()
        ctype = 'html'
      }
      else {
        qtype = data[0].toUpperCase()
        ctype = data[1]
      }
      
      if (supportedTypes.includes(qtype)) {
        url = 'https://cloudflare-dns.com/dns-query?ct=application/dns-json&name=' + domain + '&type=' + qtype
        req = await fetch(url, init)
        req = await req.json()
      
        res = {
          'success': true,
          'results': {
            'name': domain,
            'type': qtype,
            'records': []
          }
        }

        for (var val in req.Answer) {
          res['results']['records'].push(req.Answer[val]['data'])
        }

        if (res['results']['records'].length < 1) {
          res['results']['records'].push(`Unable to find any ${qtype} records for ${domain}`)
        }

        if (request.headers.get('Content-Type') == 'text/plain' || ctype == 'txt') {
          headers = {
            headers: {
              'Content-Type': 'text/plain',
              'Access-Control-Allow-Origin': '*'
            }
          }
          return new Response(res['results']['records'].join('\r\n'), headers)
        }
        if (request.headers.get('Content-Type') == 'application/json' || ctype == 'json') {
          headers = {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
          return new Response(JSON.stringify(res), headers)
        }
        if (request.headers.get('Content-Type') == 'text/html' || ctype == 'html')
        data = `<div class="container">
          <div class="starter-template">
          <div class="well well-lg">
          <h1>${res['results']['name']} (${res['results']['type']})</h1>
          <p id="counterVal" style="font-size: 42px;">
<pre>
${res['results']['records'].join('\r\n')}
</pre>
          </p>
          </div>
          <div class="panel panel-primary">
          <div class="panel-heading" style="background-color:#7a8288;">
          <h3 class="panel-title">Need to script it?</h3>
          </div>
          <div class="panel-body">
          <p>
          Verify the results using curl:
          </p>
<pre>curl https://dig.0x40.me/${res['results']['name']}/${res['results']['type']}.json</pre>

          <p>
          Need the results in plain text?
          </p>
<pre>curl https://dig.0x40.me/${res['results']['name']}/${res['results']['type']}.txt</pre>
          </div>
          </div>
          <div class="panel panel-primary">
          <div class="panel-heading" style="background-color:#7a8288;">
          <h3 class="panel-title">Need to lookup something else?</h3>
          </div>
          <div class="panel-body">
          <form class="form-inline" method="POST" action="/">
          <fieldset>
          <div class="form-group">
          <input type="text" name="recordName" class="form-control" id="recordName"
                                placeholder="${res['results']['name']}" value="${res['results']['name']}">
          </div>
          <div class="form-group">
          <select class="form-control" id="recordType" name="recordType">
          <option>Type</option>
          <option>${supportedTypes.join('</option><option>')}</option>
          </select>
          </div>
          <div class="form-group">
          <button type="submit" class="btn btn-primary">Lookup</button>
          </div>
          </fieldset>
          </form>
          </div>
          </div>
          </div>
          </div>`
        output = [
          returnHeader(res['results']['name'] + ' (' + res['results']['type'] + ')'),
          data,
          returnFooter()
        ]
        return new Response(output.join('\r\n'), {
          headers: {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*'
          }
        })
      }
      else {
        headers = {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
        res = {
          'success': lse,
          'message': 'Invalid QType provided'
        }
        return new Response(JSON.stringify(res), headers)
      }
    }
}

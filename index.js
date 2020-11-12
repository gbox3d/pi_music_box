/**
 * Created by gbox3d on 15. 7. 21..
 */
/**
 * Created by gbox3d on 2014. 6. 29..
 */
var http = require('http');
var util = require('util');
var fs = require('fs');
var os = require('os');
var UrlParser = require('url');

var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

//var config = require("./config/config_server_app").config;


var theApp = {
    version: '0.1.1',
    port: parseInt(process.argv[3]),
    upload_path: process.argv[2],
    FSM: 'ready',
    tick: 0
};

theApp.http_server = http.createServer(
    function (req, res) {

        let method = req.method;
        if (method == 'OPTIONS') {
            method = req.headers['access-control-request-method'];
        }

        // console.log(method)

        switch (method) {
            case 'GET':
                process_get(req, res);
                break;
            case 'POST':
                // console.log('post...')
                process_post(req, res);
                break;
        }
    }
);
theApp.http_server.listen(theApp.port);

console.log(`pi music box v:${theApp.version}  start  port : ${theApp.port}  ,uploads: ${theApp.upload_path}`);

//get 처리 해주기
function process_get(req, res) {

    let header = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Max-Age': '1000',
        'Content-Type': 'Application/json'
    };

    var result = UrlParser.parse(req.url, true);

    switch (result.pathname) {
        case '/play-game': {

            console.log(result.query)

            theApp.playTime = parseInt( result.query.time)
            theApp.endTime =  parseInt( result.query.end)
            theApp.tick = 0;
            theApp.FSM = 'play'

            res.writeHead(200, header);
            res.end(JSON.stringify({
                result: 'ok'
            }));

        }
            break;
        case '/stop-game': {
            if (theApp.mp3_child_process) {
                theApp.mp3_child_process.kill('SIGHUP');
            }
            theApp.mp3_child_process = null;
            theApp.tick = 0;
            theApp.FSM = 'ready'

            res.writeHead(200, header);
            res.end(JSON.stringify({
                result: 'ok'
            }));

            
            }
            break
        case '/get-status': {
            res.writeHead(200, header);
            res.end(JSON.stringify({
                result: 'ok',
                app : theApp
            }));

        }
            break;
        
        case '/play-wav':
            var child = exec('aplay ' + result.query.file, function (err, stdout, stderr) {
                if (err) throw err;
                else {
                    //console.log(stdout);
                }
            });

            res.writeHead(200, header);
            res.end(JSON.stringify({
                result: 'ok',
                msg: 'play-wav2'
            }));

            break;

        case '/play-mp3':

            if (theApp.mp3_child_process) {
                theApp.mp3_child_process.kill('SIGHUP');
            }

            theApp.mp3_child_process = spawn('mpg321', [result.query.file]);

            res.writeHead(200, header);
            res.end(JSON.stringify({
                result: 'ok',
                msg: 'play-mp3'
            }));
            break;
        case '/stop':

            //console.log(theApp.mp3_child_process);

            if (theApp.mp3_child_process) {
                theApp.mp3_child_process.kill('SIGHUP');
            }
            theApp.mp3_child_process = null;
            res.writeHead(200, header);
            res.end(JSON.stringify({
                result: 'ok',
                msg: 'stop-mp3'
            }));

            break;
        default:
            res.writeHead(200, header);
            res.end(JSON.stringify({
                result: 'ok',
                msg: `pi music box version ${theApp.version}`
            }));
            break;
    }
}
function process_post(req, res) {

    let result = UrlParser.parse(req.url, true);
    let body_data = []

    console.log(req.headers)

    console.log('pathname', result.pathname);

    console.log("incomming post data !");

    switch (result.pathname) {
        //POST로 들어 오는 데이터를 그때그때 파일에 쓰기 (메모리 절약)
        case '/upload':
            {

                let uploadName = req.headers['upload-name']

                //만약 cORS보안상의 이유로 upload-name같은 커스텀 해더를 목읽어 온다면 Access-Control-Allow-Headers 옵션을 주어 응답하면 해당 옵션에 반응하여 재요청 들어온다.
                if (!uploadName) {
                    //CORS 관련 처리 , 
                    res.writeHead(200, {
                        'Content-Type': 'text/plain',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'POST',
                        'Access-Control-Max-Age': '1000',
                        "Access-Control-Allow-Headers": "upload-name ,content-type ,file-size"
                        // "Access-Control-Allow-Headers": "*" //CORS 정책 허용  * 는 모두 허용 
                    });

                    console.log('try custom header')
                    res.end();

                }
                else {
                    res.writeHead(200, {
                        'Content-Type': 'text/plain',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'POST',
                        'Access-Control-Max-Age': '1000'
                    });
                    let filepath = `${theApp.upload_path}${uploadName}`;

                    console.log(`file path : ${filepath}`);

                    let file_size = parseInt(req.headers['file-size'])
                    console.log(file_size)

                    //파일 오픈 
                    let fd = fs.openSync(filepath, "w");

                    let _index = 0;
                    //포스트는 데이터가 조각조각 들어 온다.
                    req.on('data', function (data) {
                        _index += data.length;
                        console.log(`data receive : ${data.length} , ${_index}`);
                        fs.writeSync(fd, data);
                        // res.write(JSON.stringify({index : _index}));
                    });

                    req.on('end', function () {
                        console.log(`data receive end : ${_index}`);

                        fs.closeSync(fd);
                        // console.log(body_data)

                        let result = { result: 'ok', fn: filepath }
                        res.end(JSON.stringify(result));

                    })

                }
            }
            break;


    }

}


function main_loop() {
    switch (theApp.FSM) {

        case 'ready':
            break;
        case 'play':
            theApp.tick++;

            if (theApp.tick >= (theApp.playTime - theApp.endTime)) {
                theApp.FSM = 'ending'
                if (theApp.mp3_child_process) {
                    theApp.mp3_child_process.kill('SIGHUP');
                }

                // console.log('ending!')

                theApp.mp3_child_process = spawn('mpg321', ['www/uploads/ending.mp3']);
            }
            break;

        case 'ending':
            theApp.tick++;

            if (theApp.tick >= theApp.playTime) {
                if (theApp.mp3_child_process) {
                    theApp.mp3_child_process.kill('SIGHUP');
                }
                theApp.mp3_child_process = null;
                theApp.FSM = 'ready'
                theApp.tick = 0
            }
            break;

            break;
    }
    // console.log(theApp.tick,theApp.FSM)
    setTimeout(main_loop, 1000)

}

main_loop()
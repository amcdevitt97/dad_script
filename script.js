const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");
const axios = require('axios');
const cliProgress = require('cli-progress');

// create empty user input
let file = process.argv[2];
// create a new progress bar instance and use shades_classic theme
const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
parseCsv(file);

function parseCsv(csvFile) {
    let folder = `${__dirname}/${path.basename(csvFile).split('.')[0]}`;

    ensureExists(folder, 0o744, function (err) {
        if (err) {
            console.log(err);
        }
    });

    console.log("parsing");
    var rows = [];

    fs.createReadStream(csvFile)
        .pipe(parse({ delimiter: ",", from_line: 2 }))
        .on("data", function (row) {
            rows.push(row);
        })
        .on("error", function (error) {
            console.log(error.message);
        })
        .on('end', function () {
            // create a new progress bar instance and use shades_classic theme
            const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
            bar1.start(rows.length, 0);
            for (const [i, row] of rows.entries()) {
                onRow(folder, row);
                bar1.update(i);
            }
            bar1.update(rows.length);
            bar1.stop();
            console.log("Completed!");
        });
}

function onRow(folder, data) {
    var title = data[1];
    let imageURL = data[9];

    title = title.replaceAll("/", "slash")

    downloadImage(imageURL, `${folder}/${title}.jpg`);
}

async function downloadImage(url, filename) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });

    fs.writeFile(filename, response.data, (err) => {
        if (err) throw err;
    });
}

function ensureExists(path, mask, cb) {
    if (typeof mask == 'function') { // Allow the `mask` parameter to be optional
        cb = mask;
        mask = 0o744;
    }
    fs.mkdir(path, mask, function (err) {
        if (err) {
            if (err.code == 'EEXIST') cb(null); // Ignore the error if the folder already exists
            else cb(err); // Something else went wrong
        } else cb(null); // Successfully created folder
    });
}
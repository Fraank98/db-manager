import { authenticate } from 'dropbox-v2-api';
import * as fs from 'fs';
import * as dotenv from 'dotenv'

const accessToken = process.env.DB_TOKEN;

const dropbox = authenticate({
    token: accessToken
});

enterFolder();

function enterFolder() {
    console.log('Folder selected: /Social');
    dropbox({
        resource: 'files/list_folder',
        parameters: {
            'path': '/Social',
            'recursive': false,
            'include_media_info': false,
            'include_deleted': false,
            'include_has_explicit_shared_members': false,
            'include_mounted_folders': true,
            'include_non_downloadable_files': true
        }
    }, (err, result, response) => {
        listenChanges(result.cursor)
    });
}

function listenChanges(cursor) {
    console.log('Listening for changes...')
    dropbox({
        resource: 'files/list_folder/longpoll',
        parameters: {
            'cursor': cursor,
            'timeout': 480
        }
    }, (err, result, response) => {
        if (result.changes) {
            getChange(cursor)
        }
    });
}

function getChange(cursor) {
    console.log('Changes:')
    dropbox({
        resource: 'files/list_folder/continue',
        parameters: {
            'cursor': cursor
        }
    }, (err, result, response) => {
        console.log(result.entries[0]);
        const path = result.entries[0].path_display
        const name = result.entries[0].name
        if (!result.entries[0].id)
            listenChanges(result.cursor)
        else {
            downloadFile(path, name);
            listenChanges(result.cursor)
        }
    });
}

function downloadFile(path, name) {
    const stream = dropbox({
        resource: 'files/download',
        parameters: {
            'path': path
        }
    }, (err, result, response) => {
        console.log('Downloaded', name)
    });

    stream
        .pipe(fs.createWriteStream(`./${name}`));
}

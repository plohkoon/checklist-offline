//imports winstaller which actually makes the installer, and path for pretty pathing
const   winstaller = require('electron-winstaller').createWindowsInstaller,
        path = require('path');
//trys to get installer config if it fails exits with error
getConfig()
    .then(winstaller)
    .catch((err) => {

        console.log(err.message);
        process.exit(1);

    });

function getConfig() {
    //creates the root of the app
    const   appPath = path.join('./'),
    //creates the installers folder
            installersPath = path.join(appPath, 'installers');
    //creates the important information for winstaller
    return Promise.resolve({

        name: "Closing-Notes",
        appDirectory: path.join(appPath, "Closing-Notes-win32-x64"),
        authors: 'Precinct0702',
        noMsi: true,
        outputDirectory: path.join(installersPath, "Windows-Installers"),
        exe: "Closing-Notes.exe",
        setupExe: "ClosingNotesInstaller.exe",
        setupIcon: path.join(appPath, 'public', 'Geek.ico')

    });

}

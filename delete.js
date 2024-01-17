const fs = require('fs');
const path = require('path');

function deleteTsFiles(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            deleteTsFiles(filePath);
        } else if (path.extname(file) === '.map') {
            fs.unlinkSync(filePath);
            console.log(`Deleted: ${filePath}`);
        }
    }
}

const directory = './src'; // 替换为您要处理的目录路径
deleteTsFiles(directory);
